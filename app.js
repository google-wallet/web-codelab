/*
 * Copyright 2022 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const serviceAccountFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/path/to/key.json';
const issuerId = process.env.WALLET_ISSUER_ID || '<issuer ID>';
const classId = process.env.WALLET_CLASS_ID || 'test-class-id';

async function createPassAndToken(req, res) {
  const credentials = require(serviceAccountFile);
  const httpClient = new GoogleAuth({
    credentials: credentials,
    scopes: 'https://www.googleapis.com/auth/wallet_object.issuer'
  });

  const objectUrl = 'https://walletobjects.googleapis.com/walletobjects/v1/genericObject/';
  const objectPayload = require('./generic-pass.json');

  objectPayload.id = `${issuerId}.${req.body.email.replace(/[^\w.-]/g, '_')}-${classId}`;
  objectPayload.classId = `${issuerId}.${classId}`;

  let objectResponse;
  try {
    objectResponse = await httpClient.request({url: objectUrl + objectPayload.id, method: 'GET'});
    console.log('existing object', objectPayload.id);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      objectResponse = await httpClient.request({url: objectUrl, method: 'POST', data: objectPayload});
      console.log('new object', objectPayload.id);
    } else {
      console.error(err);
      throw err;
    }
  }

  const claims = {
    iss: credentials.client_email, // `client_email` in service account file.
    aud: 'google',
    origins: ['http://localhost:3000'],
    typ: 'savetowallet',
    payload: {
      genericObjects: [{id: objectPayload.id}],
    },
  };

  const token = jwt.sign(claims, credentials.private_key, {algorithm: 'RS256'});
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
  res.send(`<a href="${saveUrl}"><img src="wallet-button.png"></a>`);
}

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.post('/', createPassAndToken);
app.listen(3000);