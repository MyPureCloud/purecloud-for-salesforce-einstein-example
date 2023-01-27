
# Genesys Cloud for Salesforce Einstein Example

This repository contains a Salesforce Lightning component, Apex classes, and supporting files for use with Genesys Cloud for Salesforce. These items show how Salesforce Einstein can display Salesforce Knowledge articles based on ACD chat messages, digital messaging, and voice transcripts from Genesys Cloud for Salesforce all using Lightning Message Channel.

# Table of Contents

* [Getting Started](#getting-started)
  * [TL;DR](#tldr)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Configuration](#configuration)
  * [Usage](#usage)
* [Additional Information](#additional-information)


# Getting Started

## TL;DR

1. Set up Salesforce Knowledge and train your data for Salesforce Einstein.
2. Configure the Genesys Cloud for Salesforce managed package to enable client events with event types of Interaction and Notification. Enable expand chat notifications.
3. Install the unmanaged package, add a Lightning component to an app, and add values to the PureCloudKnowledgeConstants Apex class.
4. Send an ACD chat message, digital message, or place a call to a queue with transcription enabled in Genesys Cloud for Salesforce and confirm that the Lightning component updates with articles.


## Prerequisites

* Genesys Cloud for Salesforce installed in your Salesforce organization.
  For more information, see [Set up the Genesys Cloud for Salesforce integration](https://help.mypurecloud.com/?p=39326).
  * Version of the [Genesys Cloud for Salesforce](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N30000000pvMdEAI) managed package that supports Lightning Message Service.
* ACD chat, digital messaging, or transcription-enabled voice queues in your Genesys Cloud organization.


## Installation

Install the [unmanaged package](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t3i000000RQru).

## Configuration

### Set Up Salesforce Knowledge

**Important**: If the name of your knowledge article object is different from the default name (Knowledge__kav), you will not see any search results. To fix the problem, replace every instance of "Knowledge__kav" in PureCloudKnowledgeUtilityController.apxc with your object name.

1. [Enable Salesforce Knowledge](https://developer.salesforce.com/docs/atlas.en-us.knowledge_dev.meta/knowledge_dev/knowledge_development_setup_enable.htm).
2. Import Salesforce Knowledge articles from the [simple-sample-knowledge-articles.csv](resources/knowledge%20articles/simple-sample-knowledge-articles.csv) file.<br />
   You can import articles one of two ways:
   * Use [Import Articles](https://help.salesforce.com/articleView?id=knowledge_article_importer.htm&type=5) in Salesforce.
   * Download Salesforce's [Data Loader](https://help.salesforce.com/articleView?id=data_loader.htm&type=5) application.
3. Publish the articles.


### Sign Up for Salesforce Einstein

1. Go to [Einstein Platform Services](https://api.einstein.ai/signup).
2. Click **Sign Up Using Salesforce**.
3. On the activation page, download the **einstein_platform.pem** file. The file contains your key.
4. Check your email to verify your new account.


### Train Salesforce Einstein

These steps use the example dataset in the [einstein-example-dataset.csv](resources/einstein-example-dataset.csv) file. The following API calls and information come from the  [Salesforce Einstein documentation](https://metamind.readme.io/docs/create-a-lang-dataset-from-file).
1. Generate an OAuth token to use in the API calls.
   a. Go to [Generate an OAuth token](https://api.einstein.ai/token).
   b. Enter your credentials for Einstein and the key from the **einstein_platform.pem** file.
2. Create the dataset using the **einstein-example-dataset copy.csv** file.
   ```
	 curl -X POST -H "Authorization: Bearer  <TOKEN>" -H "Cache-Control: no-cache" -H "Content-Type: multipart/form-data" -F "type=text-intent" -F "name=<DATASET_NAME>" -F "data=@<FILE_LOCATION>" https://api.einstein.ai/v2/language/datasets/upload
	 ```
	 This call is asynchronous. You receive a dataset ID that you can use to check the availability of the dataset.
	 ```
	 curl -X GET -H "Authorization: Bearer  <TOKEN>" -H "Cache-Control: no-cache"  https://api.einstein.ai/v2/language/datasets/<DATASET_ID>
	 ```
3. Train the dataset and save the model ID that is returned.
	 ```
	 curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Cache-Control: no-cache" -H "Content-Type: multipart/form-data" -F "name=<DATASET_NAME>" -F "datasetId=<DATASET_ID>" https://api.einstein.ai/v2/language/train
	 ```
	 This call is asynchronous. You receive a model ID that you can use to check the status of the training.
	 ```
	 curl -X GET -H "Authorization: Bearer  <TOKEN>" -H "Cache-Control: no-cache" https://api.einstein.ai/v2/language/train/<MODEL_ID>
	 ```
	 The training is complete when status is SUCCEEDED and progress is 1.

### Configure the Genesys Cloud for Salesforce Managed Package

1. In your Salesforce organization, click **Configure** next to the Genesys Cloud for Salesforce managed package.
2. Under **Choose a Call Center**, select **Genesys Cloud for Salesforce Lightning**.
3. Select **Enable Client Events**.
4. Under **Client Event Types**, select **Interaction** and **Notification**. Click the right arrow to add it under **Chosen**.
5. Select **Expand Chat Notifications**.
6. Click **Save.**


### Install the Unmanaged Package

1. In your Salesforce organization, install the [unmanaged package](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t3i000000RQXB).
2. Add a **[Remote Site Setting](https://help.salesforce.com/articleView?id=configuring_remoteproxy.htm&type=5)**. Set **Remote Site URL** to `https://api.einstein.ai`.
3. (Optional) To dynamically create access tokens, use [Salesforce Files](https://help.salesforce.com/articleView?id=collab_salesforce_files_parent.htm&type=5) to upload the **einstein_platform.pem** file. You downloaded this file when you signed up for Salesforce Einstein.<br />
   a. Add the **Files** object as a [navigation item](https://help.salesforce.com/articleView?id=customize_lex_nav_menus_create.htm&type=0) to a Lighting app.<br />
   b. Open a Lightning app and click **Files** in the top toolbar. Then click **Upload Files**.
4. Add values to the **PureCloudKnowledgeConstants** Apex class. At a minimum, add **USER_EMAIL** and **MODEL_ID**. <br />
   If you did not upload the **einstein_platform.pem** file in step 3, then also add **ACCESS_TOKEN**. The unmanaged package uses this access token.
5. Add the **PureCloudKnowledgeUtility** Lightning component as a [utility item](https://help.salesforce.com/articleView?id=dev_apps_lightning_utilities.htm&type=0) to a Lightning app. This Lightning app must have an Open CTI Softphone.<br />
   **Note**: Be sure to select **Start automatically**.
6. Alternatively, add the lightning component into any object's page if preferred over a utility item.

### Update code if you want to enable Einstein Next Best Action integration

1. Update the Case object by adding a custom field with the API name Last_utterance__c configured as a text field. This will receive the transcript utterances that Einstein NBA strategies will evaluate. (Alternatively, change the field name to which the update targets within line 158 of the file PureCloudKnowledgeUtilityController.apxc...this code can be extended to support multiple objects, as well)
2. Uncomment lines 154-165 of the file PureCloudKnowledgeUtilityController.apxc
3. Uncomment line 89 of the file PureCloudKnowledgeUtilityHelper.js
4. Uncomment line 7 of the file PureCloudKnowledgeUtility.cmp

## Usage

1. Send an ACD chat message, digital message, or make a call to a transcription-enabled voice queue in Genesys Cloud for Salesforce.
2. As the customer, send or say a message that corresponds with the dataset that was used to train Einstein.
3. Open the Lightning component. The Lightning component updates with articles related to the interaction.
4. Click an article. Confirm that the article opens inside Salesforce.


# Additional Information

This content is [licensed](LICENSE) under the MIT license.
