**RegPack** is a packer intended for use on minified Javascript code. Current revision is 5.0.1

It is mostly suited to small size constraints (1kb, up to 4kb).

The current version works in seven stages :
- *(if enabled)* 2D, WebGL and Audio contexts method shortcuts are defined and used instead of the long, original names.
- *(if enabled)* variables are renamed in order to reduce character footprint and free tokens for compression.
- *(if enabled)* Initialization code is pushed inside the main loop, with conditional execution on the time variable, so that the unpacker can execute everything through ``setInterval()``
- string quotes are altered in order to minimize escaping inside the strings
- redundancies are eliminated and replaced by tokens, as done by JS Crush (by Aivo Paas) and First Crush (by Tim Down).
- the token list is turned into a regular expression consisting in a character class.
- the tokens are rearranged to create a negated character class (starting with a hyphen ^ then listing nontoken characters)

The text boxes show intermediate stage results. Best one gets a green highlight :
- Preprocessed : after the first four stages. Hidden if no change was brought to the initial code.
- Crushed : after the fifth stage
- RegPack'ed : best between last two stages. Depends on how the characters present in the string are spread in the ASCII table.

--
## Usage tips

- Toggle method hashing for any type of context you use. If the method renaming yields a longer code, RegPack will revert to the original one.
- "Assume global .. is a context" is for environments where the canvas is declared before your code. If entering [js1k](http://www.js1k.com), keep this on, variable is c for classic and g for webgl.
- Variable renaming is also performed inside strings, RegPack does not infer whether they are eval()ed or not. Disable if facing issues with this. Only one-letter variables are considered, others are ignored.
- Crusher settings alter the choice of strings to compress. 1/0/0 is a good allrounder, although more exotic values can yield better results depending on your code.
- Some preprocessing options negatively affect the performance and should be used with caution. Always test your packed code for speed after using these.
  - "Encapsulate with(Math)" get rid of all "Math." references in the code and enclose the evaluation with(Math).
  - "run with setInterval()" executes the unpacked code with ``setInterval()`` instead of ``eval()`` (meaning the evaluation is performed every frame).

[Use it online](http://siorki.github.io/regPack.html) or integrate it into your Node workflow (thanks to kanaka)

## CLI usage

```
regpack input.js > output.js
regpack input.js --crushGainFactor 1 --crushLengthFactor 0 --crushCopiesFactor 0 > output.js
```

From STDIN

```
cat input.js | regpack - > output.js
```

--
## Running unit tests with Node

```
cd tests
node AllTests
```

--
## License

Licensed under [MIT license](http://opensource.org/licenses/mit-license.html).

Code produced by RegPack, including the hashing (if included) and unpacking routines, is not affected by the license. No restriction to its usage or redistribution arise from its compression by RegPack.  

--

Any feedback or improvement suggestions appreciated. Contributions welcome.

@Siorki on Twitter
