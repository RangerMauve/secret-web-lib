import SecretWeb from "secret-web-lib";

// Loads existing identity from levelDB
const SW = await SecretWeb.load({
	// The DatArchive implementation to use. Optional. Defaults to (self||global).DatArchive
	DatArchive: Object,

	// A levelup instance to store data into. Mandatory
	storage: Object,

	// Whether decrypted messages should be stored in the storage. Optional. Defaults to true
	storeMessage: Boolean,

	// The password for encrypting the secret key for storage. Mandatory
	password: String,
})

const SW = await SecretWeb.create({
	// The DatArchive implementation to use. Optional. Defaults to (self||global).DatArchive
	DatArchive: Object,

	// A levelup instance to store data into. Mandatory
	storage: Object,

	// The Dat this is being created from. Optional
	originalDat: String,

	// The secret key for the identity of the parent dat. Optional, must be specified if originalDat is provided
	identitySecretKey: Uint8Array,

	// The secret key used to encrypt messages. Optional, must be specified if originalDat is provided
	secretKey: Uint8Array,

	// The password for encrypting the secret key for storage. Mandatory
	password: String
})

// Tracks the new dat identity being stored
// This is used to have your identity be tied to multiple 
// Notifies all contacts about the new URL to track messages from
await SW.addDat(datURL)

// Our main Dat URL
SW.url

// Our identity public key
SW.identity
// Our identity private key
SW.identitySecretKey

// Public key for encryption
SW.publicKey
// Private key for encryption
SW.secretKey

// Get a list of public keys for your contacts
const contacts = await SW.getContacts()
const contactInfo = {
	// The name you assigned to this contact
	name: String,

	// The main URL for the contact, used to identify them
	url: String,

	// The list of ALL of their dat URLs
	urls: [],

	// The contact's identity key for verifying signed files
	identity: Uint8Array,

	// Their public key used for encryption
	publicKey: Uint8Array,
}

// Add a contact to your list via their dat URL
// Will save their name and get their identity and public key from their dat URL
// Will start seeding their dats if possible
const contactInfo = await SW.addContact(name, datURL)

// Update a contact's name
await SW.renameContact(contactInfo.url, name)

/*Iterate through new messages, starting with the oldest
Returns an async iterable to be iterated through
You can call `.return` on the iterable to close it.
Can pass in filter object that looks like
{
  // Filter by given type or pattern for a type
  type: String or Regex,
  // Filter by from
  url: String,
}
`data` is  parsed from the content. It's either parsed JSON data, or a Uint8Array
*/
for await (let { url, timestamp, type, data} of SW.getNewMessages()) {
	// Show the message?
}

// Get message history, starting with the newest
// Otherwise same as getNewMessages
for await (let { url, timestamp, type, data} of SW.getMessages()) {
	// Show the message?
}

// Create a message that should be recieved by someone. You can send messages to contacts or to yourself.
// The type can be anything you want so that you can add features in your application
// The data should be JSON-serializable, or a Uint8Array
// Can send a message to multiple people at once by specifying an array of dat urls
const timestamp = await SW.sendMessage([contactInfo.url], type, data)

// Utilities for verification

// Get the signature for some data. Data should be a Uint8Array, signature is a Uint8Array
const signed = SW.sign(data)

// Attempts to verify some data and get the contents out
const message = SecretWeb.openSigned(identity, signed);

// Pre-canned message types

// Messages directed to oneself
// Added a new contact
"sw/contacts/added" {name, dats, publicKey} // Sent when adding a contact on a device. Used to build up contacts array
"sw/contacts/renamed" {name, publicKey} // Sent when renaming a contact. Used to update the contacts array
"sw/dats/added" [{url}] // Sent when adding a new dat for ones own identity. Used to start reading updates from it

// Messages directed to contacts
"sw/contacts/greeting" {} // Sent to a contact initially to verify that you've added them
"sw/contacts/introduce" [{name, url}] // Share contacts
"sw/dats/added" [{url}] // Sent to contacts to let them know about your dat URLs so they can track them all
"sw/message" {text} // Sent to a contact to represent a simple text message. Clients should render text as markdown