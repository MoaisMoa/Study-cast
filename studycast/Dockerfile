FROM eclipse-temurin:25-jre

WORKDIR /app

COPY build/libs/studycast-0.0.1-SNAPSHOT.war app.war

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.war", "--spring.profiles.active=prod"]
