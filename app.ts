import express, { Request, Response } from "express";
import path from "path";
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import axios from "axios";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "client/build")));

app.get("/send", async (request: Request, response: Response) => {
  console.log("inside send");
  const sqs = new SQSClient({ endpoint: "http://localstack:4566" });

  const publishCommand = new SendMessageCommand({
    QueueUrl: "http://localstack:4566/000000000000/otel-queue",
    MessageBody: "Hello World!",
  });

  const sqsResponse = await sqs.send(publishCommand);
  response.json({ messageId: sqsResponse.MessageId });
});

app.get("/receive", async (request: Request, response: Response) => {
  const sqs = new SQSClient({ endpoint: "http://localstack:4566" });

  const receiveCommand = new ReceiveMessageCommand({
    QueueUrl: "http://localstack:4566/000000000000/otel-queue",
    MessageAttributeNames: ["All"],
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 30,
  });

  const sqsResponse = await sqs.send(receiveCommand);
  sqsResponse.Messages?.forEach((message) => {
    console.log(message.Body);
    const deleteCommand = new DeleteMessageCommand({
      QueueUrl: "http://localstack:4566/000000000000/otel-queue",
      ReceiptHandle: message.ReceiptHandle,
    });

    const options = {
      host: "echo",
      port: 5678,
    };

    axios.get("http://echo:5678").then((res) => {
      console.log("Received response from server", res.status);
    });

    sqs.send(deleteCommand);
    console.log("delete done!");
    response.json({ message: `done` });
  });
});

app.get("/home", (request: Request, response: Response) => {
  console.log(request.url);
  response.json({ message: `Welcome to the home page!` });
});

// --------------------Listen
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
