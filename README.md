<h1 align="center"> ts-hyber-v2 </h1>
<p align="center">
  <b>ts-hyber-v2 is a library sending push, viber, sms, whatsappnotifications by hyber.im</b>
</p>

## Documentations

https://webigorkiev.github.io/ts-hyber-v2/

## Installation

```bash
yarn add ts-hyber-v2
```

## Usage

```typescript
import {hyber} from "ts-hyber-v2";

const provider = hyber({
    id: "<client_id>",
    login: "Bascic auth login",
    pw: "Basic auth password"
})
await provider.send({
    // notifications options
});
```

## Known Issues

* When receiving the status, an error is returned if about 10 seconds have not passed since the moment of sending