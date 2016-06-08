# Merchant Server Reference implementation for mobile Apps

This is a testing server for the development of Veritran's IOs and Android SDK. Also acts as a reference implementation for the methods to be implemented by merchants to use the mobile sdk

## Required 
There is only one endpoint from the merchant server that are required to use this SDK.

1. `/charge` - used to do the charging of the transactions.

## Optional

There are several optional endpoint that can be implemented.

### Save Card Feature

Credit card one click and two click feature including save card and delete card.

#### Get Card List

`GET /card` - used to get all saved card from specific user

Headers:

- X-Auth : _AUTHENTICATION TOKEN_
- Content-Type: application/json
- Accept: application/json

Response:

```json
{
    "status_code": 200,
    "status_message": "success",
    "data": [
        {
            "saved_token_id": "481111ROMUdhBGMQhjVtEPNcsGee1114",
            "masked_card": "481111-1114"
        }
    ]
}
```

#### Save Card

`POST /card/register` - used to save a card token for next payment

Headers:

- X-Auth : _AUTHENTICATION TOKEN_
- Content-Type: application/json
- Accept: application/json

Request:

```json
{
    "status_code": "200",
    "masked_card": "481111-1114",
    "saved_token_id": "481111ROMUdhBGMQhjVtEPNcsGee1114",
}
```

Response:

```json
{
    "status_code": 201,
    "status_message": "Card is saved"
}
```

#### Delete Card

`DELETE /card/{token}` - used to delete a saved card token

Headers:

- X-Auth : _AUTHENTICATION TOKEN_
- Content-Type: application/json
- Accept: application/json

Parameters:

- token - Token id from veritrans card registration

Response:

```json
{
    "status_code": 200,
    "status_message": "Card is deleted"
}
```

#### Get authentication token

`POST /auth` - used to get authentication to access the merchant token

Example JSON response

```json
{
  "X-Auth": "baf9ce634d2e65283cd1647bd082c8c2"
}
```

### Get Offers or Promotion

`/promotion` - used to get the credit card promotions 
    
Example JSON response.

```json
{
  "status_code": 200,
  "status_message": "success",
  "data": {
    "discount": [
      {
        "title": "Mandiri Heboh Hura Hura",
        "description": "Diskon 35% bagi pengguna Mandiri dan pengguna dengan CC berawalan 48111",
        "discount_percentage": 35,
        "bins": [
          "mandiri",
          "48111"
        ]
      }
    ],
    "installment": [
      {
        "title": "Cicilan Mandiri dan BNI 6 Bulan",
        "description": "Cicilan 0% bagi pengguna kartu kredit berawalan 5410111 selama 6 Bulan",
        "installment_terms": [
          "6"
        ],
        "bins": [
          "5410111"
        ]
      }
    ]
  }
}
```

## Dependencies:

-Node Js

-NPM (other dependencies are installed through NPM)

## How to Run:
```sh
  npm install
  
  node index.js
```
