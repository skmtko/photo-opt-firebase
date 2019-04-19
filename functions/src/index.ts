import * as functions from 'firebase-functions';

import * as admin from 'firebase-admin';


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

// database に書き込み可能にする
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
export const addMessage = functions.https.onRequest((request: any, response: any): any => {

  // Grab the text parameter.
  const original: string = request.query.text;

  // const db = admin.firestore();

  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  return admin.database().ref('/messages').push({ original: original }).then((snapshot) => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    return response.redirect(303, snapshot.ref.toString());
  });
});

export const makeUppercase = functions.database.ref('/messages/{pushId}/original')
  .onCreate((snapshot: any, context: any): any => {
    // Grab the current value of what was written to the Realtime Database.
    const original: string = snapshot.val();

    console.log('Uppercasing', context.params.pushId, original);

    const uppercase: string = original.toUpperCase();

    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return snapshot.ref.parent.child('uppercase').set(uppercase);
  });


export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
