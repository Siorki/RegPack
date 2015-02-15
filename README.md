**RegPack** is a packer intended for use on minified Javascript code. Current revision is 3.0.2.

It is mostly suited to small size constraints (1kb, up to 4kb).

The current version works in five stages :
- *(if enabled)* 2D, WebGL and Audio contexts method shortcuts are defined and used instead of the long, original names.
- *(if enabled)* variables are renamed in order to reduce character footprint and free tokens for compression.
- redundancies are eliminated and replaced by tokens, as done by JS Crush (by Aivo Paas) and First Crush (by Tim Down).
- the token list is turned into a regular expression consisting in a character class. 
- the tokens are rearranged to create a negated character class (starting with a hyphen ^ then listing nontoken characters)
 
The text boxes show intermediate stage results. Best one gets a green highlight :
- Preprocessed : after the first two stages. Hidden if no change was brought to the initial code.
- Crushed : after the third stage
- RegPack'ed : best between fourth and fifth stage. Depends on how the characters present in the string are spread in the ASCII table.

Tips for using RegPack :
- Toggle method hashing for any type of context you use. If the method renaming yields a longer code, RegPack will revert to the original one.
- "Assume global .. is a context" is for environments where the canvas is declared before your code. If entering js1k, keep this on, variable is c for classic and ++, and g for webgl.
- Variable renaming is also performed inside strings, RegPack does not infer whether they are eval()ed or not. Disable if facing issues with this. Only one-letter variables are considered, others are ignored.
- Crusher settings alter the choice of strings to compress. 1/0/0 is a good allrounder, although more exotic values can yield better results depending on your code.
- "Pack with(Math)" get rid of all "Math." references in the code and enclose the evaluation with(Math). May gain a few extra bytes, but likely to slow down the execution.
  
[Use it online](http://siorki.github.io/regPack.html) or integrate it into your Node workflow (thanks to kanaka)
```
npm install   # to install minimist module for command line parsing
node ./regPack.js input.js --crushGainFactor 1 --crushLengthFactor 0 --crushCopiesFactor 0 > output.js
```

--
Licensed under [MIT license](http://opensource.org/licenses/mit-license.html).

Code produced by RegPack, including the hashing (if included) and unpacking routines, is not affected by the license. No restriction to its usage or redistribution arise from its compression by RegPack.  

--
  
Any feedback or improvement suggestions appreciated.

@Siorki on Twitter
