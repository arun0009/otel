# OTEL POC

To Run this poc just run `docker-compose up --build`

* Send SQS: http://localhost:5005/send

* Receive SQS: http://localhost:5005/receive

* Jaeger UI: http://http://localhost:16686/


Shows SQS (Producer) -> SQS <- SQS (Consumer) w/ http call to depict Async/Event Driven pattern and show how tracing works.