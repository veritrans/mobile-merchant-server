# Merchant Server Reference implementation for mobile Apps

This is a testing server for the development of Veritran's IOs and Android SDK. Also acts as a reference implementation for the methods to be implemented by merchants to use the mobile sdk

#### Merchant Server 

There is only one endpoint from the merchant server that are required to use this SDK.

1. `/charge` - used to do the charging of the transactions.

There are several optional endpoint that can be implemented.

1. Credit card one click and two click feature 
    1. `GET /card` - used to get all saved card from specific user
    2. `POST /card/register` - used to save a card token for next payment
    3. `DELETE /card/{token}` - used to delete a saved card token
    4. `/auth` - used to get authentication to access the merchant token
2. Offers
    TBD



## Dependencies:

-Node Js

-NPM (other dependencies are installed through NPM)

## How to Run:
```sh
  npm install
  
  node index.js
```
