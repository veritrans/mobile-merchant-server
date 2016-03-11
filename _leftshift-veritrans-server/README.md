# Veritrans API

## Base API

```
https://hangout.betas.in/veritrans/api
```

## Register Device Token for GCM

```
/register
```

### Request

```
// Headers

{
  x-auth: token // OPTIONAL: only when device ID updated
}

// Body params
{
  oldRegistrationId: OLD_DEVICE_ID_IF_ANY, // default null
  registrationId: DEVICE_ID // REQUIRED
}
```

### Response

```
{
  error: "MESSAGE" // In case of error
}

{
  message: "SUCCESS",
  toekn: UNIQUE_TOKEN // Unique Identifier for all further processes.
}
```

## Charge: For all type of transactions

```
/charge
```

### Request

```
// Headers

{
  x-auth: token // REQUIRED
}

// Body params
{
  JSON_BODY // Please follow the documentation [here](http://docs.veritrans.co.id/en/vtdirect/integration_mandiriecash.html)
}
```

### Response

```
{
  error: "MESSAGE" // In case of error
}

{
  message: "SUCCESS",
  OTHER_PARAMS // According to different type of merchants
}
```

## card: Add/Get Card(s).

```
/card
```

### Request

```
// Headers

{
  x-auth: token // REQUIRED
}

// Body params
{
  cardNumber: CARD_NUMBER,
  cardExpiryMonth: CARD_EXP_MO,
  cardExpiryYear: CARD_EXP_YR,
  secure: SECURE,
  twoClick:  TWO_CLICK,
  bank: BANK,
  cardType: CARD_TYPE,
  savedTokenId: TOKEN
}
```

### Response

```
{
  error: "MESSAGE" // In case of error
}

{
  message: "SUCCESS",
  CARDS_ARRAY // Only In GET call
}
```

## card: DELETE - POST

```
/card/delete
```

### Request

```
// Headers

{
  x-auth: token // REQUIRED
}

// Body params
{
  cardNumber: CARD_NUMBER,
  cardExpiryMonth: CARD_EXP_MO,
  cardExpiryYear: CARD_EXP_YR,
  bank: BANK
}
```

### Response

```
{
  error: "MESSAGE" // In case of error
}

{
  message: "SUCCESS"
}
```
