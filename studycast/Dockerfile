FROM eclipse-temurin:25-jre

WORKDIR /app

# 호스트 OS가 UTC로 동작 중이라도 컨테이너 자체 시계를 한국 시간 기준으로 고정
ENV TZ=Asia/Seoul

COPY build/libs/studycast-0.0.1-SNAPSHOT.war app.war

EXPOSE 8080

# JVM 기본 타임존도 명시적으로 한국 시간 고정 (날짜 계산이 서버 환경 설정에 기대지 않도록)
ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "app.war", "--spring.profiles.active=prod"]
