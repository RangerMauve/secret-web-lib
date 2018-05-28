# Secret Web (Lib)

The goal is to build a totally distributed and encrypted base for chat applications built on the DatArchive API and TweetNaCl.

The goals of this project are:
- Keep it simple enough to make it easy to implement in other languages
- Use proven crypto primitives (TweetNaCl)
- Use secure p2p protocols (Dat) for tranport
- Have a high level API that can easily be adapted for other people's apps
	- Have pluggable DatArchive, crypto, storage (random-access-storage, levelup)
	- Abstract away all the encryption and message parsing, updated loading, etc
	- Support one to one and group chats
	- Avoid node-isms like Buffer and Node streams
	- Support multiple Dat archives for a single identity
	- Support multiple identities at once
- Even if someone has learned of a person's dat, they shouldn't be able to learn who they're talking to

How it works, high level:
- Each identity will have one or more dat archives
- Identities will always be referred to using their original dat key even if that dat isn't in use anymore
- The archive will look like:
    - `identity.pub` The ed25519 public key for this identity, used to verify that this dat is who it says it is
    - `verification.sign` The dat URL + the public key signed by the identity in `identity.pub`, used to verify this dat, and it's public key, does indeed belong to that identity
	- `publicKey.pub` The x25519-xsalsa20-poly1305 public key used for encrypting data using `nacl.box`
	- `posts/` The directory storing all the person's posts
		- `{random}.json.swep` All posts are encoded in the SWEP format, and the post name should be random data. E.g. Hash of random bytes.
- Users share their archive URLs with each other in order to communicate
- A user will attempt to decrypt each of the other's posts and take note of any posts addressed to them
- The posts themselves can store either binary data, or JSON structure data
- Posts are tagged with a `type` string to enable filtering for different applications.
- Everything is encrypted and a person can only see messages addressed to them
- Users should primarily exchange URLs through QR codes and cameras, but they could also copy-paste the links and share them through other means

SWEP (Secret Web Encrypted Post) file format:
- Used to encrypt JSON or binary data
- Content is encrypted using xsalsa20-poly1305 (secretbox) with a unique key per message
- The key is then encrypted using x25519-xsalsa20-poly1305 (box) for each recipient.
- The encrypted keys are stored in a header that allocates enough room for 8 recipients at a time. This helps hide the number of recipients
- In addition to the data, the content contains the following:
	- `{timestap (unix) (8 bytes)}{format (1 byte)}{typeLength (1 byte)}{type (typeLength bytes)}{content (rest of message)}`
	- The `type` is encoded in utf8 with it's length prefixed. Limited to 255 bytes
	- A `timestamp` which is a 8byte integer representing the time in MS since the Unix epoch
	- A `format` byte which is `0x01` for binary and `0x02` for JSON
- The contents are signed using ed25519 and the signature is boxed using the libsodium `sign` function
- The number of recipient groups, the header, and the message contents are then appended together and saved with the `swep` extension

SWEF (Secret Web Encrypted File) file format:
- Used to encrypt files with a password
- Password is hashed using SHA-512 which is then used as the key for secret box
- A nonce is generated per file using random bytes
- File is encrypted using xsalsa20-poly1305 (secretbox)
- The nonce and the encrypted file are appended and saved with the `swep` extension
- The file should be linked to using `dat://{archive}/{file}.swef?password={password}`

Exchanging information and tracking contacts
- Tracking data to share between devices is done by sending messages to your own identity
	- This is done by encrypting the message with the identity's own public key
	- When a new device is added, both devices make a posts in their own dat directed at the identity acknowledging the other device
	- When a new contact is added on a device, it posts this event to itself so other devices will be notified about it
- When users share URLs, they make a post introducing each other (including name / list of device dats)

Security considerations:
- The Dat network can still expose a person's IP address when seeding. This means a person's IP address could be traced if a sufficiently advanced adversary inspects the DHT.
- This can expose associations by way of people advertising each others dats when they follow their data.
- If a person's URL isn't shared, it is impossible to use this attack
- Generally speaking, knowing a person's network (which is already hard to do) might not be enough to be a threat.
- Even if someone has access to a person's dat, they can't discover URls of who they're taking to, or even know how many people they are talking to.
- Since all peers replicate each others' dats, it's harder to find out which peer was the origin unless you're capable of connecting to all of them and timing which one produces a new piece of data first.
- Since posts use timestamps, this could be used as metadata to know when a person is active.
- People wanting a higher level of security may want to use a coffee shop wifi, VPN, or Tor to hide their IP
- Since the core of this system is totally distributed it's difficult or impossible to censor individuals and it's hard to track people unless they share their URls.
- People cannot recieve spam from anyone they aren't already in contact with.
- Peers in the network can potentially log IP addresses and file names of what other peers are downloading. This can be used to detect who is reading from a given dat.
