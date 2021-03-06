/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as functions from 'firebase-functions'
import {Storage} from '@google-cloud/storage'
import * as path from 'path'
import * as sharp from 'sharp'

const gcs = new Storage();

const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

// type FinalezeObject = { bucket: any, name: any, contentType: any }

/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * Sharp.
 */
const generateThumbnail = functions.storage
  .object().onFinalize( object => {
    const fileBucket: string = object.bucket; // The Storage bucket that contains the file.
    const filePath: any = object.name; // File path in the bucket.
    const contentType: any = object.contentType; // File content type.

    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
      console.log('This is not an image.');
      return null;
    }

    // Get the file name.
    const fileName = path.basename(filePath);
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
      console.log('Already a Thumbnail.');
      return null;
    }

    // Download file from bucket.
    const bucket = gcs.bucket(fileBucket);

    const metadata = {
      contentType: contentType,
    };
    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    // Create write stream for uploading thumbnail
    const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({ metadata });

    // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
    const pipeline = sharp();
    pipeline.resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT).pipe(thumbnailUploadStream);

    bucket.file(filePath).createReadStream().pipe(pipeline);

    return new Promise((resolve, reject): any =>
      thumbnailUploadStream.on('finish', resolve).on('error', reject));
  }
);

export default generateThumbnail