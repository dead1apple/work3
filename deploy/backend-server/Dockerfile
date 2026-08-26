FROM docker.m.daocloud.io/library/eclipse-temurin:17-jre-jammy

WORKDIR /app

RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --create-home --shell /usr/sbin/nologin app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app/uploads

COPY --chown=app:app app.jar /app/app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
