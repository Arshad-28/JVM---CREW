package com.jvmcrew.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.model.PushSubscription;
import com.jvmcrew.model.enums.NotificationType;
import com.jvmcrew.repository.PushSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.spec.ECNamedCurveGenParameterSpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${push.vapid.public-key:}")
    private String configuredPublicKey;

    @Value("${push.vapid.private-key:}")
    private String configuredPrivateKey;

    @Value("${push.vapid.subject:mailto:support@engineerspace.com}")
    private String configuredSubject;

    private PushService pushService;
    private String activePublicKey;
    private boolean isPushReady = false;

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }

            String subject = StringUtils.hasText(configuredSubject) ? configuredSubject.trim() : "mailto:support@engineerspace.com";

            if (StringUtils.hasText(configuredPublicKey) && StringUtils.hasText(configuredPrivateKey)) {
                pushService = new PushService(configuredPublicKey.trim(), configuredPrivateKey.trim(), subject);
                activePublicKey = configuredPublicKey.trim();
                isPushReady = true;
                log.info("WebPushService initialized with configured production VAPID keys");
            } else {
                // Generate a robust ephemeral EC secp256r1 KeyPair for development / fallback
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("ECDSA", BouncyCastleProvider.PROVIDER_NAME);
                ECNamedCurveGenParameterSpec ecSpec = new ECNamedCurveGenParameterSpec("secp256r1");
                kpg.initialize(ecSpec);
                KeyPair kp = kpg.generateKeyPair();

                pushService = new PushService(kp, subject);
                ECPublicKey pub = (ECPublicKey) kp.getPublic();
                byte[] encodedPub = Utils.encode(pub);
                activePublicKey = Base64.getUrlEncoder().withoutPadding().encodeToString(encodedPub);
                isPushReady = true;
                log.info("WebPushService initialized with generated VAPID keypair (Public: {}...)",
                        activePublicKey.substring(0, Math.min(16, activePublicKey.length())));
            }
        } catch (Exception e) {
            log.error("Failed to initialize WebPushService: {}", e.getMessage(), e);
            isPushReady = false;
        }
    }

    public String getVapidPublicKey() {
        return activePublicKey;
    }

    public boolean isPushReady() {
        return isPushReady;
    }

    @Async("notificationTaskExecutor")
    @Transactional
    public CompletableFuture<Void> sendPushAsync(
            PushSubscription subscription,
            String title,
            String message,
            String actionUrl,
            NotificationType type,
            Long entityId
    ) {
        if (!isPushReady || subscription == null || !Boolean.TRUE.equals(subscription.getActive())) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", title);
            payload.put("message", message);
            payload.put("body", message);
            payload.put("url", StringUtils.hasText(actionUrl) ? actionUrl : "/");
            payload.put("type", type != null ? type.name() : "NOTIFICATION");
            payload.put("entityId", entityId);
            payload.put("timestamp", System.currentTimeMillis());

            String payloadJson = objectMapper.writeValueAsString(payload);
            byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);

            Notification notification = new Notification(
                    subscription.getEndpoint(),
                    subscription.getP256dh(),
                    subscription.getAuth(),
                    payloadBytes
            );

            HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode == 200 || statusCode == 201) {
                pushSubscriptionRepository.touchSubscription(subscription.getId(), Instant.now());
                log.debug("Push sent successfully to endpoint {}... (status {})",
                        subscription.getEndpoint().substring(0, Math.min(25, subscription.getEndpoint().length())), statusCode);
            } else if (statusCode == 404 || statusCode == 410) {
                // Subscription has expired or been revoked by user/browser
                pushSubscriptionRepository.deactivateEndpoint(subscription.getEndpoint(), Instant.now());
                log.info("Push subscription expired (HTTP {}), deactivated endpoint {}...", statusCode,
                        subscription.getEndpoint().substring(0, Math.min(25, subscription.getEndpoint().length())));
            } else {
                log.warn("Push delivery returned HTTP {}: {}", statusCode, response.getStatusLine().getReasonPhrase());
            }
        } catch (Exception e) {
            log.warn("Web Push transmission failed for endpoint {}: {}",
                    subscription.getEndpoint().substring(0, Math.min(25, subscription.getEndpoint().length())), e.getMessage());
        }

        return CompletableFuture.completedFuture(null);
    }
}
