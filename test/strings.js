/* eslint-disable import/no-extraneous-dependencies */
const { expect } = require('chai');
const en = require('./en.json');
const es = require('./es.json');
const stringsEn = require('../strings.js')([en]);
const stringsEs = require('../strings.js')([es, en]);

describe('strings.js', () => {
  describe('with a single file', () => {
    it('should getString() at the root', () => {
      expect(stringsEn.getString('monkey')).to.equal(en.monkey);
    });
    it('should get a nested getString()', () => {
      expect(stringsEn.getString('intro/hello')).to.equal(en.intro.hello);
    });
    it('should get multiply nested getString()', () => {
      expect(stringsEn.getString('intro/options/copy')).to.equal(en.intro.options.copy);
    });
    it('should get the name of an object', () => {
      expect(stringsEn.getString('thing')).to.equal(en.thing.name);
    });
    it('should fill index-based substitutions', () => {
      expect(stringsEn.getString('intro/bye', ['Bob', 'Susan']))
        .to.equal('Goodbye, Bob! I hope you enjoyed seeing Susan!');
    });
    it('should fill key-based substitutions', () => {
      expect(stringsEn.getString('substitution', { testKey: 'whoop' }))
        .to.equal('Wow this one whoop has a key!');
    });
    it('should access an array element', () => {
      expect(stringsEn.getString('choices/0')).to.equal(en.choices[0]);
      expect(stringsEn.getString('choices/1')).to.equal(en.choices[1]);
    });
    it('should return an array element with a bounded index', () => {
      expect(stringsEn.getString('choices/b-1')).to.equal(en.choices[0]);
      expect(stringsEn.getString('choices/b0')).to.equal(en.choices[0]);
      expect(stringsEn.getString('choices/b1')).to.equal(en.choices[1]);
      expect(stringsEn.getString('choices/b2')).to.equal(en.choices[1]);
    });
    it('should return a random array element', () => {
      expect(stringsEn.getString('choices/?')).to.satisfy((v) => (
        en.choices.includes(v)
      ));
      expect(stringsEn.getString('choices/?')).to.satisfy((v) => (
        en.choices.includes(v)
      ));
      expect(stringsEn.getString('choices/?')).to.satisfy((v) => (
        en.choices.includes(v)
      ));
    });
    it('should return a random array element with even distribution', () => {
      const firstVal = stringsEn.getString('choices/!');
      expect(firstVal).to.satisfy((v) => (
        en.choices.includes(v)
      ));
      expect(stringsEn.getString('choices/!')).to.satisfy((v) => (
        en.choices.includes(v) && v !== firstVal
      ));
    });
    it('should return an error when a string is missing', () => {
      expect(stringsEn.getString('missing/not/there')).to.equal('ERROR-MISSING-STRING: "missing/not/there"');
    });
    it('should return an error when an expected substitution is missing', () => {
      expect(stringsEn.getString('substitution', {})).to.equal('Wow this one ERROR-NO-SUB-testKey has a key!');
    });
    it('should return an error when the wrong type of object is in the JSON', () => {
      expect(stringsEn.getString('intro')).to.equal('BAD-TYPE: "intro"');
    });
  });

  describe('with a two files', () => {
    it('should override values in the second file that are in the first file', () => {
      expect(stringsEs.getString('monkey')).to.equal(es.monkey);
    });

    it('should fall back to values in the second file that are not in the first file', () => {
      expect(stringsEs.getString('intro/hello')).to.equal(en.intro.hello);
    });
  });
});
