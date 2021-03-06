'use strict';

/* Dependencies. */
var test = require('tape');
var franc = require('..');
var support = require('../data/support');
var fixtures = require('./fixtures');

/* Constants; */
var MAGIC_NUMBER = 41;
var MAGIC_LANGUAGE = 'pol';
var SOME_HEBREW = 'הפיתוח הראשוני בשנות ה־80 התמקד בגנו ובמערכת הגרפית';

if (MAGIC_LANGUAGE === franc(fixtures[MAGIC_NUMBER])) {
  throw new Error(
    'The fixture belonging to magic number should not equal' +
    ' magic language'
  );
}

/* Tests. */
test('franc()', function (t) {
  var expected;

  t.equal(typeof franc, 'function', 'should be of type `function`');
  t.equal(typeof franc('XYZ'), 'string', 'should return a string');
  t.equal(franc('XYZ'), 'und', 'should return "und" on an undetermined value');
  t.equal(franc(), 'und', 'should return "und" on a missing value');
  t.equal(franc('the the the the the '), 'sco', 'should work on weird values');

  /* Inspired by lifthrasiir on hackernews:
   * https://news.ycombinator.com/item?id=8405672 */
  t.equal(
    franc(
      '한국어 문서가 전 세계 웹에서 차지하는 비중은 2004년에 4.1%로, ' +
      '이는 영어(35.8%), 중국어(14.1%), 일본어(9.6%), 스페인어(9%), ' +
      '독일어(7%)에 이어 전 세계 6위이다. 한글 문서와 한국어 문서를 같은' +
      '것으로 볼 때, 웹상에서의 한국어 사용 인구는 전 세계 69억여 명의 인구 ' +
      '중 약 1%에 해당한다.'
    ),
    'kor',
    'should work on unique-scripts with many latin characters (1)'
  );
  t.equal(
    franc(
      '現行の学校文法では、英語にあるような「目的語」「補語」' +
      'などの成分はないとする。英語文法では "I read a book." の ' +
      '"a book" はSVO文型の一部をなす目的語であり、また、"I go to ' +
      'the library." の "the library" ' +
      'は前置詞とともに付け加えられた修飾語と考えられる。'
    ),
    'jpn',
    'should work on unique-scripts with many latin characters (2)'
  );

  expected = franc(fixtures[MAGIC_NUMBER]);

  t.notEqual(
    franc(fixtures[MAGIC_NUMBER], {
      blacklist: [expected]
    }),
    expected,
    'should accept `blacklist`'
  );

  t.equal(
    franc(fixtures[MAGIC_NUMBER], {
      whitelist: [MAGIC_LANGUAGE]
    }),
    MAGIC_LANGUAGE,
    'should accept `whitelist`'
  );

  t.equal(
    franc(SOME_HEBREW, {whitelist: ['eng']}),
    'und',
    'should accept `whitelist` for different scripts'
  );

  t.equal(franc('the', {minLength: 3}), 'sco', 'should accept `minLength` (1)');
  t.equal(franc('the', {minLength: 4}), 'und', 'should accept `minLength` (2)');

  t.equal(franc('987 654 321'), 'und', 'should return `und` for generic characters');

  t.end();
});

test('franc.all()', function (t) {
  var expected;

  t.equal(typeof franc.all, 'function', 'should be of type `function`');

  t.deepEqual(
    franc.all('XYZ'),
    [['und', 1]],
    'should return an array containing language--probability tuples'
  );

  t.deepEqual(
    franc.all('פאר טסי'),
    [['und', 1]],
    'should return `[["und", 1]]` without matches (1)'
  );

  t.deepEqual(
    franc.all('פאר טסי', {minLength: 3}),
    [['heb', 0], ['ydd', 0]],
    'should return `[["und", 1]]` without matches (2)'
  );

  t.deepEqual(
    franc.all('xyz'),
    [['und', 1]],
    'should return `[["und", 1]]` without matches (3)'
  );

  t.deepEqual(
    franc.all(),
    [['und', 1]],
    'should return `[["und", 1]]` for a missing value'
  );

  t.deepEqual(
    franc.all('987 654 321'),
    [['und', 1]],
    'should return `[["und", 1]]` for generic characters'
  );

  t.deepEqual(
    franc.all('the the the the the ').slice(0, 2),
    [['sco', 1], ['eng', 0.9858799798285426]],
    'should work on weird values'
  );

  expected = franc(fixtures[MAGIC_NUMBER]);

  t.deepEqual(
    franc
      .all(fixtures[MAGIC_NUMBER], {blacklist: [expected]})
      .map(function (tuple) {
        return tuple[0];
      })
      .indexOf(expected),
    -1,
    'should accept `blacklist`'
  );

  t.deepEqual(
    franc.all(fixtures[MAGIC_NUMBER], {whitelist: [MAGIC_LANGUAGE]}),
    [[MAGIC_LANGUAGE, 1]],
    'should accept `whitelist`'
  );

  t.deepEqual(
    franc.all(SOME_HEBREW, {whitelist: ['eng']}),
    [['und', 1]],
    'should accept `whitelist` for different scripts'
  );

  t.deepEqual(
    franc.all('the', {minLength: 3}).slice(0, 2),
    [['sco', 1], ['eng', 0.9988851727982163]],
    'should accept `minLength` (1)'
  );

  t.deepEqual(
    franc.all('the', {minLength: 4}),
    [['und', 1]],
    'should accept `minLength` (2)'
  );

  t.end();
});

test('algorithm', function (t) {
  support.forEach(function (language, index) {
    if (fixtures[index] === '') {
      console.log(
        'Missing fixture for language `' +
        language.iso6393 + '` (' + language.name + ').'
      );
    } else {
      classify(fixtures[index], language);
    }
  });

  function classify(input, language) {
    var example = input.replace(/\n/g, '\\n').slice(0, 20) + '...';

    t.equal(
      franc.all(input)[0][0],
      language.iso6393,
      example + ' (' + language.name + ')'
    );
  }

  t.end();
});
