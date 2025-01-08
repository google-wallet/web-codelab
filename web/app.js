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
const bodyParser = require('body-parser');
const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// TODO: Define Issuer ID
const issuerId = 'ISSUER_ID';

// TODO: Define Class ID
const classId = `${issuerId}.codelab_class`;

const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';

const credentials = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const httpClient = new GoogleAuth({
  credentials: credentials,
  scopes: 'https://www.googleapis.com/auth/wallet_object.issuer'
});

/**
 * Creates a sample pass class based on the template defined below.
 * 
 * This class contains multiple editable fields that showcase how to 
 * customize your class.
 * 
 * @param res A representation of the HTTP result in Express.
 */
async function createPassClass(res) {
  // TODO: Create a Generic pass class
}

/**
 * Creates a sample pass object based on a given class.
 * 
 * @param req A representation of the HTTP request in Express.
 * @param res A representation of the HTTP result in Express.
 * @param classId The identifier of the parent class used to create the object.
 */
async function createPassObject(req, res, classId) {
  // TODO: Create a new Generic pass for the user
}

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.post('/', async (req, res) => {
  await createPassClass(res);
  await createPassObject(req, res, classId);
});
app.listen(3000);