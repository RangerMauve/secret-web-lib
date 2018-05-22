import SecretWeb from "secret-web-lib";

const SW = await SecretWeb.create({
	// The DatArchive implementation to use. Optional. Defaults to (self||global).DatArchive
	DatArchive: Object,

	// A levelup instance to store data into. Mandatory
	storage: Object,

	// The Dat this is being created from. Optional
	originalDat: String,
	// The secret key for the identity of the parent dat. Optional, must be specified if originalDat is provided
	secretKey: Uint8Array,

	// The password for encrypting the secret key for storage. Mandatory
	password: String
})

// Loads existing identity from levelDB
const SW = await SecretWeb.load({
	// The DatArchive implementation to use. Optional. Defaults to (self||global).DatArchive
	DatArchive: Object,

	// A levelup instance to store data into. Mandatory
	storage: Object,

	// The password for encrypting the secret key for storage. Mandatory
	password: String,
})

// Tracks the new dat identity being stored
// This is used to have your identity be tied to multiple 
// Notifies all contacts about the new URL to track messages from
await SW.addDat(datURL)

// Get your own public key identity
const publicKey = SW.publicKey;
// Get your own secret key in case you want to save it somewhere external
const secretKey = SW.secretKey;


// Get a list of public keys for your contacts
const contacts = await SW.getContacts()
const contactInfo = {
	// The name you assigned to this contact
	name: String,

	// The list of their dat URLs
	urls: [],

	// Their identity
	publicKey: Uint8Array,
}

// Add a contact to your list via their dat URL
// Will save their name and get their public key from their dat URL
// Will start seeding their dats if possible
const contactInfo = await SW.addContact(name, datURL)

// Update a contact's name
await SW.renameContact(publicKey, name)

// Iterate through new messages, starting with the oldest
// Returns an async iterable to be iterated through
// You can call `.return` on the iterable to close it.
// Can pass in filter object that looks like
// {
//   // Filter by given type or pattern for a type
//   type: String or Regex
//   // Filter by from
//   publicKey: Uint8Array
// }
// `data` is an Object parsed from JSON
for await (let { publicKey, timestamp, type, data} of SW.getNewMessages()) {
	// Show the message?
}

// Get message history, starting with the newest
// Returns an async iterable to be iterated through
// You can call `.return` on the iterable to close it.
// Can pass in a filter object the same way as getNewMessages
for await (let { publicKey, timestamp, type, data} of SW.getMessages()) {
	// Show the message?
}

// Create a message that should be recieved by someone. You can send messages to contacts or to yourself.
// The type can be anything you want so that you can add features in your application
// The data should be JSON-serializable
const timestamp = await SW.sendMessage(publicKey, type, data)

// Pre-canned message types

// Messages directed to oneself
// Added a new contact
"sw/contacts/added" {name, dats, publicKey} // Sent when adding a contact on a device. Used to build up contacts array
"sw/contacts/renamed" {name, publicKey} // Sent when renaming a contact. Used to update the contacts array
"sw/dats/added" [{url}] // Sent when adding a new dat for ones own identity. Used to start reading updates from it

// Messages directed to contacts
"sw/contact/greeting" {} // Sent to a contact initially to verify that you've added them
"sw/dats/added" [{url}] // Sent to contacts to let them know about your dat URLs so they can track them all
"sw/message" {text} // Sent to a contact to represent a simple text message. Clients should ideally support this as markdown encoded