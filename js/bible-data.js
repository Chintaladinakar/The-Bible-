// Scriptura - Core Bible Canon, Offline Library & Daily Devotionals
export const CANON_BOOKS = [
  // Old Testament - Law (Pentateuch)
  { id: 'GEN', name: 'Genesis', testament: 'OT', genre: 'Law', chapters: 50 },
  { id: 'EXO', name: 'Exodus', testament: 'OT', genre: 'Law', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', testament: 'OT', genre: 'Law', chapters: 27 },
  { id: 'NUM', name: 'Numbers', testament: 'OT', genre: 'Law', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', testament: 'OT', genre: 'Law', chapters: 34 },

  // Historical Books
  { id: 'JOS', name: 'Joshua', testament: 'OT', genre: 'History', chapters: 24 },
  { id: 'JDG', name: 'Judges', testament: 'OT', genre: 'History', chapters: 21 },
  { id: 'RUT', name: 'Ruth', testament: 'OT', genre: 'History', chapters: 4 },
  { id: '1SA', name: '1 Samuel', testament: 'OT', genre: 'History', chapters: 31 },
  { id: '2SA', name: '2 Samuel', testament: 'OT', genre: 'History', chapters: 24 },
  { id: '1KI', name: '1 Kings', testament: 'OT', genre: 'History', chapters: 22 },
  { id: '2KI', name: '2 Kings', testament: 'OT', genre: 'History', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', testament: 'OT', genre: 'History', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', testament: 'OT', genre: 'History', chapters: 36 },
  { id: 'EZR', name: 'Ezra', testament: 'OT', genre: 'History', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', testament: 'OT', genre: 'History', chapters: 13 },
  { id: 'EST', name: 'Esther', testament: 'OT', genre: 'History', chapters: 10 },

  // Poetry & Wisdom
  { id: 'JOB', name: 'Job', testament: 'OT', genre: 'Poetry & Wisdom', chapters: 42 },
  { id: 'PSA', name: 'Psalms', testament: 'OT', genre: 'Poetry & Wisdom', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', testament: 'OT', genre: 'Poetry & Wisdom', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', testament: 'OT', genre: 'Poetry & Wisdom', chapters: 12 },
  { id: 'SNG', name: 'Song of Solomon', testament: 'OT', genre: 'Poetry & Wisdom', chapters: 8 },

  // Major Prophets
  { id: 'ISA', name: 'Isaiah', testament: 'OT', genre: 'Prophecy', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', testament: 'OT', genre: 'Prophecy', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', testament: 'OT', genre: 'Prophecy', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', testament: 'OT', genre: 'Prophecy', chapters: 48 },
  { id: 'DAN', name: 'Daniel', testament: 'OT', genre: 'Prophecy', chapters: 12 },

  // Minor Prophets
  { id: 'HOS', name: 'Hosea', testament: 'OT', genre: 'Prophecy', chapters: 14 },
  { id: 'JOL', name: 'Joel', testament: 'OT', genre: 'Prophecy', chapters: 3 },
  { id: 'AMO', name: 'Amos', testament: 'OT', genre: 'Prophecy', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', testament: 'OT', genre: 'Prophecy', chapters: 1 },
  { id: 'JON', name: 'Jonah', testament: 'OT', genre: 'Prophecy', chapters: 4 },
  { id: 'MIC', name: 'Micah', testament: 'OT', genre: 'Prophecy', chapters: 7 },
  { id: 'NAM', name: 'Nahum', testament: 'OT', genre: 'Prophecy', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', testament: 'OT', genre: 'Prophecy', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', testament: 'OT', genre: 'Prophecy', chapters: 3 },
  { id: 'HAG', name: 'Haggai', testament: 'OT', genre: 'Prophecy', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', testament: 'OT', genre: 'Prophecy', chapters: 14 },
  { id: 'MAL', name: 'Malachi', testament: 'OT', genre: 'Prophecy', chapters: 4 },

  // New Testament - Gospels
  { id: 'MAT', name: 'Matthew', testament: 'NT', genre: 'Gospels', chapters: 28 },
  { id: 'MRK', name: 'Mark', testament: 'NT', genre: 'Gospels', chapters: 16 },
  { id: 'LUK', name: 'Luke', testament: 'NT', genre: 'Gospels', chapters: 24 },
  { id: 'JHN', name: 'John', testament: 'NT', genre: 'Gospels', chapters: 21 },

  // History
  { id: 'ACT', name: 'Acts', testament: 'NT', genre: 'History', chapters: 28 },

  // Pauline Epistles
  { id: 'ROM', name: 'Romans', testament: 'NT', genre: 'Epistles', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', testament: 'NT', genre: 'Epistles', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', testament: 'NT', genre: 'Epistles', chapters: 13 },
  { id: 'GAL', name: 'Galatians', testament: 'NT', genre: 'Epistles', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', testament: 'NT', genre: 'Epistles', chapters: 6 },
  { id: 'PHP', name: 'Philippians', testament: 'NT', genre: 'Epistles', chapters: 4 },
  { id: 'COL', name: 'Colossians', testament: 'NT', genre: 'Epistles', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', testament: 'NT', genre: 'Epistles', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', testament: 'NT', genre: 'Epistles', chapters: 3 },
  { id: '1TI', name: '1 Timothy', testament: 'NT', genre: 'Epistles', chapters: 6 },
  { id: '2TI', name: '2 Timothy', testament: 'NT', genre: 'Epistles', chapters: 4 },
  { id: 'TIT', name: 'Titus', testament: 'NT', genre: 'Epistles', chapters: 3 },
  { id: 'PHM', name: 'Philemon', testament: 'NT', genre: 'Epistles', chapters: 1 },

  // General Epistles
  { id: 'HEB', name: 'Hebrews', testament: 'NT', genre: 'Epistles', chapters: 13 },
  { id: 'JAS', name: 'James', testament: 'NT', genre: 'Epistles', chapters: 5 },
  { id: '1PE', name: '1 Peter', testament: 'NT', genre: 'Epistles', chapters: 5 },
  { id: '2PE', name: '2 Peter', testament: 'NT', genre: 'Epistles', chapters: 3 },
  { id: '1JN', name: '1 John', testament: 'NT', genre: 'Epistles', chapters: 5 },
  { id: '2JN', name: '2 John', testament: 'NT', genre: 'Epistles', chapters: 1 },
  { id: '3JN', name: '3 John', testament: 'NT', genre: 'Epistles', chapters: 1 },
  { id: 'JUD', name: 'Jude', testament: 'NT', genre: 'Epistles', chapters: 1 },

  // Prophecy
  { id: 'REV', name: 'Revelation', testament: 'NT', genre: 'Prophecy', chapters: 22 }
];

// Curated Offline Text Corpus (Ready without any network connection)
export const OFFLINE_PASSAGES = {
  // Genesis Chapter 1
  'GEN_1': {
    book: 'Genesis',
    chapter: 1,
    title: 'The Creation of Heaven and Earth',
    subtitle: 'The First Day to the Seventh Day',
    verses: [
      { num: 1, text: 'In the beginning God created the heaven and the earth.' },
      { num: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
      { num: 3, text: 'And God said, Let there be light: and there was light.' },
      { num: 4, text: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
      { num: 5, text: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.' },
      { num: 6, text: 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.' },
      { num: 7, text: 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.' },
      { num: 8, text: 'And God called the firmament Heaven. And the evening and the morning were the second day.' },
      { num: 9, text: 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.' },
      { num: 10, text: 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.' },
      { num: 26, text: 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth.' },
      { num: 27, text: 'So God created man in his own image, in the image of God created he him; male and female created he them.' },
      { num: 31, text: 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.' }
    ]
  },

  // Psalm 23
  'PSA_23': {
    book: 'Psalms',
    chapter: 23,
    title: 'The Divine Shepherd',
    subtitle: 'A Psalm of David',
    isPoetry: true,
    verses: [
      { num: 1, text: 'The LORD is my shepherd; I shall not want.' },
      { num: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
      { num: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
      { num: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
      { num: 5, text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
      { num: 6, text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.' }
    ]
  },

  // Psalm 91
  'PSA_91': {
    book: 'Psalms',
    chapter: 91,
    title: 'The Shelter of the Most High',
    subtitle: 'Security Under God\'s Wings',
    isPoetry: true,
    verses: [
      { num: 1, text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.' },
      { num: 2, text: 'I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.' },
      { num: 3, text: 'Surely he shall deliver thee from the snare of the fowler, and from the noisome pestilence.' },
      { num: 4, text: 'He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler.' },
      { num: 5, text: 'Thou shalt not be afraid for the terror by night; nor for the arrow that flieth by day;' },
      { num: 11, text: 'For he shall give his angels charge over thee, to keep thee in all thy ways.' },
      { num: 12, text: 'They shall bear thee up in their hands, lest thou dash thy foot against a stone.' },
      { num: 14, text: 'Because he hath set his love upon me, therefore will I deliver him: I will set him on high, because he hath known my name.' }
    ]
  },

  // Psalm 121
  'PSA_121': {
    book: 'Psalms',
    chapter: 121,
    title: 'The Keeper of Israel',
    subtitle: 'A Song of Ascents',
    isPoetry: true,
    verses: [
      { num: 1, text: 'I will lift up mine eyes unto the hills, from whence cometh my help.' },
      { num: 2, text: 'My help cometh from the LORD, which made heaven and earth.' },
      { num: 3, text: 'He will not suffer thy foot to be moved: he that keepeth thee will not slumber.' },
      { num: 4, text: 'Behold, he that keepeth Israel shall neither slumber nor sleep.' },
      { num: 5, text: 'The LORD is thy keeper: the LORD is thy shade upon thy right hand.' },
      { num: 6, text: 'The sun shall not smite thee by day, nor the moon by night.' },
      { num: 7, text: 'The LORD shall preserve thee from all evil: he shall preserve thy soul.' },
      { num: 8, text: 'The LORD shall preserve thy going out and thy coming in from this time forth, and even for evermore.' }
    ]
  },

  // Proverbs Chapter 3
  'PRO_3': {
    book: 'Proverbs',
    chapter: 3,
    title: 'Trust in the Lord with All Thine Heart',
    subtitle: 'Exhortations to Wisdom',
    isPoetry: true,
    verses: [
      { num: 1, text: 'My son, forget not my law; but let thine heart keep my commandments:' },
      { num: 2, text: 'For length of days, and long life, and peace, shall they add to thee.' },
      { num: 3, text: 'Let not mercy and truth forsake thee: bind them about thy neck; write them upon the table of thine heart:' },
      { num: 4, text: 'So shalt thou find favour and good understanding in the sight of God and man.' },
      { num: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
      { num: 6, text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
      { num: 7, text: 'Be not wise in thine own eyes: fear the LORD, and depart from evil.' },
      { num: 13, text: 'Happy is the man that findeth wisdom, and the man that getteth understanding.' },
      { num: 17, text: 'Her ways are ways of pleasantness, and all her paths are peace.' },
      { num: 18, text: 'She is a tree of life to them that lay hold upon her: and happy is every one that retaineth her.' }
    ]
  },

  // Ecclesiastes 3
  'ECC_3': {
    book: 'Ecclesiastes',
    chapter: 3,
    title: 'A Time for Everything',
    subtitle: 'The Seasons of Life Under the Sun',
    isPoetry: true,
    verses: [
      { num: 1, text: 'To every thing there is a season, and a time to every purpose under the heaven:' },
      { num: 2, text: 'A time to be born, and a time to die; a time to plant, and a time to pluck up that which is planted;' },
      { num: 3, text: 'A time to kill, and a time to heal; a time to break down, and a time to build up;' },
      { num: 4, text: 'A time to weep, and a time to laugh; a time to mourn, and a time to dance;' },
      { num: 7, text: 'A time to rend, and a time to sew; a time to keep silence, and a time to speak;' },
      { num: 8, text: 'A time to love, and a time to hate; a time of war, and a time of peace.' },
      { num: 11, text: 'He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.' }
    ]
  },

  // Isaiah 40
  'ISA_40': {
    book: 'Isaiah',
    chapter: 40,
    title: 'Comfort Ye My People',
    subtitle: 'The Incomparable God and Wings of Eagles',
    isPoetry: true,
    verses: [
      { num: 1, text: 'Comfort ye, comfort ye my people, saith your God.' },
      { num: 3, text: 'The voice of him that crieth in the wilderness, Prepare ye the way of the LORD, make straight in the desert a highway for our God.' },
      { num: 8, text: 'The grass withereth, the flower fadeth: but the word of our God shall stand for ever.' },
      { num: 28, text: 'Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding.' },
      { num: 29, text: 'He giveth power to the faint; and to them that have no might he increaseth strength.' },
      { num: 30, text: 'Even the youths shall faint and be weary, and the young men shall utterly fall:' },
      { num: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' }
    ]
  },

  // Matthew 5 - The Beatitudes
  'MAT_5': {
    book: 'Matthew',
    chapter: 5,
    title: 'The Sermon on the Mount',
    subtitle: 'The Beatitudes and the Salt & Light',
    verses: [
      { num: 1, text: 'And seeing the multitudes, he went up into a mountain: and when he was set, his disciples came unto him:' },
      { num: 2, text: 'And he opened his mouth, and taught them, saying,' },
      { num: 3, text: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.', isChrist: true },
      { num: 4, text: 'Blessed are they that mourn: for they shall be comforted.', isChrist: true },
      { num: 5, text: 'Blessed are the meek: for they shall inherit the earth.', isChrist: true },
      { num: 6, text: 'Blessed are they which do hunger and thirst after righteousness: for they shall be filled.', isChrist: true },
      { num: 7, text: 'Blessed are the merciful: for they shall obtain mercy.', isChrist: true },
      { num: 8, text: 'Blessed are the pure in heart: for they shall see God.', isChrist: true },
      { num: 9, text: 'Blessed are the peacemakers: for they shall be called the children of God.', isChrist: true },
      { num: 14, text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.', isChrist: true },
      { num: 16, text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.', isChrist: true }
    ]
  },

  // Matthew 6 - The Lord's Prayer & Do Not Worry
  'MAT_6': {
    book: 'Matthew',
    chapter: 6,
    title: 'The Model Prayer & Divine Provision',
    subtitle: 'Consider the Lilies of the Field',
    verses: [
      { num: 9, text: 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.', isChrist: true },
      { num: 10, text: 'Thy kingdom come. Thy will be done in earth, as it is in heaven.', isChrist: true },
      { num: 11, text: 'Give us this day our daily bread.', isChrist: true },
      { num: 12, text: 'And forgive us our debts, as we forgive our debtors.', isChrist: true },
      { num: 13, text: 'And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.', isChrist: true },
      { num: 26, text: 'Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?', isChrist: true },
      { num: 28, text: 'And why take ye thought for raiment? Consider the lilies of the field, how they grow; they toil not, neither do they spin:', isChrist: true },
      { num: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', isChrist: true },
      { num: 34, text: 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.', isChrist: true }
    ]
  },

  // John 1
  'JHN_1': {
    book: 'John',
    chapter: 1,
    title: 'The Word Made Flesh',
    subtitle: 'The Light Shineth in Darkness',
    verses: [
      { num: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
      { num: 2, text: 'The same was in the beginning with God.' },
      { num: 3, text: 'All things were made by him; and without him was not any thing made that was made.' },
      { num: 4, text: 'In him was life; and the life was the light of men.' },
      { num: 5, text: 'And the light shineth in darkness; and the darkness comprehended it not.' },
      { num: 12, text: 'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:' },
      { num: 14, text: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.' }
    ]
  },

  // John 14
  'JHN_14': {
    book: 'John',
    chapter: 14,
    title: 'The Way, the Truth, and the Life',
    subtitle: 'The Promise of the Holy Spirit & Peace',
    verses: [
      { num: 1, text: 'Let not your heart be troubled: ye believe in God, believe also in me.', isChrist: true },
      { num: 2, text: 'In my Father\'s house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.', isChrist: true },
      { num: 6, text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', isChrist: true },
      { num: 27, text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.', isChrist: true }
    ]
  },

  // Romans 8
  'ROM_8': {
    book: 'Romans',
    chapter: 8,
    title: 'Life in the Spirit',
    subtitle: 'More than Conquerors',
    verses: [
      { num: 1, text: 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.' },
      { num: 26, text: 'Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.' },
      { num: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
      { num: 31, text: 'What shall we then say to these things? If God be for us, who can be against us?' },
      { num: 37, text: 'Nay, in all these things we are more than conquerors through him that loved us.' },
      { num: 38, text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,' },
      { num: 39, text: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.' }
    ]
  },

  // 1 Corinthians 13
  '1CO_13': {
    book: '1 Corinthians',
    chapter: 13,
    title: 'The Hymn of Love',
    subtitle: 'Faith, Hope, and Love',
    isPoetry: true,
    verses: [
      { num: 1, text: 'Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.' },
      { num: 2, text: 'And though I have the gift of prophecy, and understand all mysteries, and all knowledge; and though I have all faith, so that I could remove mountains, and have not charity, I am nothing.' },
      { num: 4, text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,' },
      { num: 5, text: 'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;' },
      { num: 7, text: 'Beareth all things, believeth all things, hopeth all things, endureth all things.' },
      { num: 8, text: 'Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away.' },
      { num: 13, text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.' }
    ]
  },

  // Philippians 4
  'PHP_4': {
    book: 'Philippians',
    chapter: 4,
    title: 'The Peace That Passes Understanding',
    subtitle: 'Rejoice Always & The Secret of Contentment',
    verses: [
      { num: 4, text: 'Rejoice in the Lord alway: and again I say, Rejoice.' },
      { num: 6, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
      { num: 7, text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
      { num: 8, text: 'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.' },
      { num: 13, text: 'I can do all things through Christ which strengtheneth me.' },
      { num: 19, text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.' }
    ]
  },

  // Revelation 21
  'REV_21': {
    book: 'Revelation',
    chapter: 21,
    title: 'The New Heaven and New Earth',
    subtitle: 'No More Tears, Death, or Sorrow',
    verses: [
      { num: 1, text: 'And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea.' },
      { num: 2, text: 'And I John saw the holy city, new Jerusalem, coming down from God out of heaven, prepared as a bride adorned for her husband.' },
      { num: 3, text: 'And I heard a great voice out of heaven saying, Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people, and God himself shall be with them, and be their God.' },
      { num: 4, text: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.' },
      { num: 5, text: 'And he that sat upon the throne said, Behold, I make all things new. And he said unto me, Write: for these words are true and faithful.' },
      { num: 6, text: 'And he said unto me, It is done. I am Alpha and Omega, the beginning and the end. I will give unto him that is athirst of the fountain of the water of life freely.' }
    ]
  }
};

// Daily Verse of the Day Series (Rotates daily with profound reflections)
export const DAILY_DEVOTIONALS = [
  {
    day: 1,
    reference: 'Philippians 4:6-7',
    passageKey: 'PHP_4',
    verseNum: 7,
    text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
    theme: 'Divine Peace',
    meditation: 'Peace is not the absence of storms, but the presence of the Unshakable. Breathe deeply, surrender your burdens, and allow God’s tranquility to guard your heart today.',
    prayer: 'Lord, grant me a stillness that outlasts the noise of the world. Center my mind on Your eternal presence.'
  },
  {
    day: 2,
    reference: 'Psalm 23:1-3',
    passageKey: 'PSA_23',
    verseNum: 1,
    text: 'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
    theme: 'Sacred Rest',
    meditation: 'Rest is not a luxury to be earned after exhaustion, but a holy ordinance. Let the Shepherd restore your depleted soul beside the waters of quietness.',
    prayer: 'Good Shepherd, guide my footsteps today. Keep me from striving and teach me to rest in Your providence.'
  },
  {
    day: 3,
    reference: 'Isaiah 40:31',
    passageKey: 'ISA_40',
    verseNum: 31,
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    theme: 'Renewed Strength',
    meditation: 'Waiting upon God is active faith: quiet anticipation, anchored confidence, and surrender of self-reliance. You will soar again.',
    prayer: 'Father, when my energy falters, exchange my human weakness for Your heavenly endurance.'
  },
  {
    day: 4,
    reference: 'Proverbs 3:5-6',
    passageKey: 'PRO_3',
    verseNum: 5,
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
    theme: 'Direction & Trust',
    meditation: 'Our perspective is bound by time; God’s wisdom spans eternity. Relinquish the demand to understand every twist of the path.',
    prayer: 'Guide my thoughts, words, and decisions today. Make my crooked paths straight by Your wisdom.'
  },
  {
    day: 5,
    reference: 'Romans 8:38-39',
    passageKey: 'ROM_8',
    verseNum: 39,
    text: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
    theme: 'Unbreakable Love',
    meditation: 'Nothing in heaven or on earth, in yesterday’s regrets or tomorrow’s dread, can tear you away from the embrace of divine grace.',
    prayer: 'Thank You, Father, for an affection that never wanes and a covenant that never fails.'
  },
  {
    day: 6,
    reference: 'John 14:27',
    passageKey: 'JHN_14',
    verseNum: 27,
    text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
    theme: 'Living Shalom',
    meditation: 'The world gives conditional peace, easily shattered. Christ gives unconditional Shalom that thrives even in the midst of adversity.',
    prayer: 'Lord Jesus, impart Your deep, unbroken peace to my soul this hour.'
  },
  {
    day: 7,
    reference: '1 Corinthians 13:13',
    passageKey: '1CO_13',
    verseNum: 13,
    text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.',
    theme: 'The Supreme Way of Love',
    meditation: 'Knowledge passes, accomplishments fade, but love endures through eternity. Let every encounter today be sanctified by selfless kindness.',
    prayer: 'Pour Your love through me, that I may be a living vessel of grace to every soul I meet.'
  }
];

// Curated Reading Plans
export const READING_PLANS = [
  {
    id: 'plan_peace',
    name: 'Sanctuary of Peace',
    duration: '7 Days',
    description: 'Immerse your spirit in the great Psalms of comfort, refuge, and quiet waters.',
    readings: [
      { day: 1, title: 'The Shepherd’s Presence', book: 'Psalms', ch: 23 },
      { day: 2, title: 'Secret Place of Protection', book: 'Psalms', ch: 91 },
      { day: 3, title: 'Keeper of Israel', book: 'Psalms', ch: 121 },
      { day: 4, title: 'Wings of Dawn', book: 'Isaiah', ch: 40 },
      { day: 5, title: 'Lilies of the Field', book: 'Matthew', ch: 6 },
      { day: 6, title: 'Peace Not as the World Gives', book: 'John', ch: 14 },
      { day: 7, title: 'Peace That Surpasses Understanding', book: 'Philippians', ch: 4 }
    ]
  },
  {
    id: 'plan_wisdom',
    name: 'The Path of Wisdom',
    duration: '5 Days',
    description: 'Glean timeless discernment from Solomon’s proverbs and the Beatitudes.',
    readings: [
      { day: 1, title: 'Trust in the Lord', book: 'Proverbs', ch: 3 },
      { day: 2, title: 'A Time for Everything', book: 'Ecclesiastes', ch: 3 },
      { day: 3, title: 'The Pure in Heart', book: 'Matthew', ch: 5 },
      { day: 4, title: 'The Hymn of Love', book: '1 Corinthians', ch: 13 },
      { day: 5, title: 'The New Heaven & Earth', book: 'Revelation', ch: 21 }
    ]
  }
];

// Words of Jesus by verse, for chapters where the app carries red-letter marks.
// Ranges hold for every translation because they follow verse numbers, not wording.
export const RED_LETTER_VERSES = {
  MAT_5: '3-48',
  MAT_6: '1-34',
  JHN_1: '38-39,42-43,47-48,50-51',
  JHN_14: '1-4,6-7,9-21,23-31'
};

// Single-chapter books need an explicit verse range when requested from bible-api.com
export const SINGLE_CHAPTER_VERSES = {
  OBA: 21,
  PHM: 25,
  '2JN': 13,
  '3JN': 14,
  JUD: 25
};

// "How are you feeling?" on Home: one verse for each feeling, text copied from the bundled KJV and Telugu Bibles
export const MOOD_VERSES = [
  { id: 'upset', label: 'Upset', labelTe: 'మనసు కలత చెందినప్పుడు', book: 'John', chapter: 14, verse: 27,
    text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
    textTe: "శాంతి మీ కనుగ్రహించి వెళ్లుచున్నాను; నా శాంతినే మీ కనుగ్రహించుచున్నాను; లోకమిచ్చు నట్టుగా నేను మీ కనుగ్రహించుటలేదు; మీ హృదయ మును కలవరపడనియ్యకుడి, వెరవనియ్యకుడి." },
  { id: 'stuck', label: 'Stuck', labelTe: 'ముందుకు సాగలేనప్పుడు', book: 'Isaiah', chapter: 43, verse: 19,
    text: "Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert.",
    textTe: "ఇదిగో నేనొక నూతనక్రియ చేయుచున్నాను ఇప్పుడే అది మొలుచును మీరు దాని నాలోచింపరా? నేను అరణ్యములో త్రోవ కలుగజేయుచున్నాను ఎడారిలో నదులు పారజేయుచున్నాను." },
  { id: 'anxious', label: 'Anxious', labelTe: 'ఆందోళనగా ఉన్నప్పుడు', book: '1 Peter', chapter: 5, verse: 7,
    text: "Casting all your care upon him; for he careth for you.",
    textTe: "ఆయన మిమ్మునుగూర్చి చింతించుచున్నాడు గనుక మీ చింత యావత్తు ఆయనమీద వేయుడి." },
  { id: 'sad', label: 'Sad', labelTe: 'దుఃఖంలో ఉన్నప్పుడు', book: 'Psalms', chapter: 34, verse: 18,
    text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    textTe: "విరిగిన హృదయముగలవారికి యెహోవా ఆసన్నుడు నలిగిన మనస్సుగలవారిని ఆయన రక్షించును." },
  { id: 'lonely', label: 'Lonely', labelTe: 'ఒంటరిగా అనిపించినప్పుడు', book: 'Psalms', chapter: 27, verse: 10,
    text: "When my father and my mother forsake me, then the LORD will take me up.",
    textTe: "నా తలిదండ్రులు నన్ను విడిచినను యెహోవా నన్ను చేరదీయును." },
  { id: 'afraid', label: 'Afraid', labelTe: 'భయం వేసినప్పుడు', book: 'Psalms', chapter: 56, verse: 3,
    text: "What time I am afraid, I will trust in thee.",
    textTe: "నాకు భయము సంభవించు దినమున నిన్ను ఆశ్ర యించుచున్నాను." },
  { id: 'tired', label: 'Tired', labelTe: 'అలసిపోయినప్పుడు', book: 'Matthew', chapter: 11, verse: 28,
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    textTe: "ప్రయాసపడి భారము మోసికొనుచున్న సమస్త జను లారా, నా యొద్దకు రండి; నేను మీకు విశ్రాంతి కలుగ జేతును." },
  { id: 'angry', label: 'Angry', labelTe: 'కోపం వచ్చినప్పుడు', book: 'Psalms', chapter: 37, verse: 8,
    text: "Cease from anger, and forsake wrath: fret not thyself in any wise to do evil.",
    textTe: "కోపము మానుము ఆగ్రహము విడిచిపెట్టుము వ్యసనపడకుము అది కీడుకే కారణము" },
  { id: 'doubting', label: 'Doubting', labelTe: 'సందేహం కలిగినప్పుడు', book: 'Mark', chapter: 9, verse: 24,
    text: "And straightway the father of the child cried out, and said with tears, Lord, I believe; help thou mine unbelief.",
    textTe: "వెంటనే ఆ చిన్నవాని తండ్రినమ్ముచున్నాను, నాకు అపనమ్మకముండకుండ సహాయము చేయుమని బిగ్గరగా చెప్పెను." },
  { id: 'guilty', label: 'Guilty', labelTe: 'తప్పు చేశానని అనిపించినప్పుడు', book: '1 John', chapter: 1, verse: 9,
    text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
    textTe: "మన పాపములను మనము ఒప్పుకొనిన యెడల, ఆయన నమ్మదగినవాడును నీతిమంతుడును గనుక ఆయన మన పాపములను క్షమించి సమస్త దుర్నీతినుండి మనలను పవిత్రులనుగా చేయును." },
  { id: 'hurt', label: 'Hurt by someone', labelTe: 'ఎవరైనా గాయపరిచినప్పుడు', book: 'Colossians', chapter: 3, verse: 13,
    text: "Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.",
    textTe: "ఎవడైనను తనకు హానిచేసెనని యొకడనుకొనిన యెడల ఒకని నొకడు సహించుచు ఒకని నొకడు క్షమించుడి, ప్రభువు మిమ్మును క్షమించినలాగున మీరును క్షమించుడి." },
  { id: 'grateful', label: 'Grateful', labelTe: 'కృతజ్ఞతగా ఉన్నప్పుడు', book: 'Psalms', chapter: 107, verse: 1,
    text: "O give thanks unto the LORD, for he is good: for his mercy endureth for ever.",
    textTe: "యెహోవా దయాళుడు ఆయనకు కృతజ్ఞతా స్తుతులు చెల్లించుడి ఆయన కృప నిత్యముండును." }
];
