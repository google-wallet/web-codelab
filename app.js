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

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { GoogleAuth } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const axios = require('axios')

const serviceAccountFile =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "./key.json";
const issuerId = process.env.WALLET_ISSUER_ID || "<issuer ID>";
const classId = process.env.WALLET_CLASS_ID || "test-class-id";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function generatePassWithPageData (pageData, email) {
  const pageName = pageData.title
  const pageOwner = pageData.pageOwner
  const pageUrl = pageData.url
  const pageTarget = pageData.targetWithCurrency.value
  const pageRaised = pageData.donationSummary.totalAmount.value
  const pageCharity = pageData.relationships.beneficiaries.nodes[0].name
  const pageEndDate = pageData.endDate

  const credentials = require(serviceAccountFile);
  const httpClient = new GoogleAuth({
    credentials: credentials,
    scopes: "https://www.googleapis.com/auth/wallet_object.issuer",
  });

  const objectUrl =
    "https://walletobjects.googleapis.com/walletobjects/v1/genericObject/";
  const objectPayload = require("./generic-pass.json");

  objectPayload.id = `${issuerId}.${email.replace(
    /[^\w.-]/g,
    "_"
  )}-${classId}`;
  objectPayload.classId = `${issuerId}.${classId}`;

  objectPayload.header.defaultValue.value = pageName;
  objectPayload.textModulesData[0].body = pageOwner;
  objectPayload.textModulesData[1].body = pageCharity;
  objectPayload.textModulesData[2].body = `£${pageRaised/100}`
  objectPayload.textModulesData[3].body = `${(pageRaised/pageTarget)}`
  objectPayload.textModulesData[4].body = pageEndDate;
  objectPayload.barcode.alternateText = pageUrl

  let objectResponse;
  try {
    objectResponse = await httpClient.request({
      url: objectUrl + objectPayload.id,
      method: "GET",
    });
    console.log("existing object", objectPayload.id);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      objectResponse = await httpClient.request({
        url: objectUrl,
        method: "POST",
        data: objectPayload,
      });
      console.log("new object", objectPayload.id);
    } else {
      console.error(err);
      throw err;
    }
  }

  const claims = {
    iss: credentials.client_email, // `client_email` in service account file.
    aud: "google",
    origins: ["http://localhost:3000"],
    typ: "savetowallet",
    payload: {
      genericObjects: [{ id: objectPayload.id }],
    },
  };

  const token = jwt.sign(claims, credentials.private_key, {
    algorithm: "RS256",
  });
  return `https://pay.google.com/gp/v/save/${token}`;
}

app.get("/:pageSlug", async (req, res) => {
  const frpSlug = req.params.pageSlug;

  const payload =   {
    "operationName": null,
    "variables": {},
    "query": `{\n  page(type: ONE_PAGE, slug: \"page/${frpSlug}\") {\n    title\n    owner {\n      name\n    }\n    url\n    targetWithCurrency {\n      value\n      currencyCode\n    }\n    donationSummary {\n      totalAmount {\n        value\n      }\n    }\n    endDate\n    relationships {\n      beneficiaries(first: 5) {\n        nodes {\n          ... on Charity {\n            name\n          }\n        }\n      }\n    }\n  }\n}\n`
  };

  const pageDataRes = await axios.post('https://graphql.staging.justgiving.com/', payload);
  const pageData = pageDataRes.data.data.page

  const saveURL = await generatePassWithPageData(pageData, 'testing@gmail.com');

  res.send(saveURL);
})


app.listen(3000);
