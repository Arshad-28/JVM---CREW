# Stage 1: Build the application using Maven
FROM maven:3.9.8-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and compile
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN mkdir -p /app/uploads/audio
COPY --from=build /app/target/jvmcrew-server-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Xms128m -Xmx384m -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]


