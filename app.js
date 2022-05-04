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

const serviceAccountFile = '/path/to/key.json';
const issuerId = '';
const classId = '';

async function createPassAndToken(req, res) {
  res.send("Form submitted!");
}

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.post('/', createPassAndToken);
app.listen(3000);