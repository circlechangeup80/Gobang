const LEVEL = {
    EASY: 2,
    MEDIUM: 4,
    HARD: 6,
};

const BOARD_WID = 15;
const PADDED_BOARD_WID = 16;
const PADDED_BOARD_WID_SHT = 4;
const PADDED_BOARD_WID_MSK = 0xF;

const NONE = 0;
const BLACK = 1;
const WHITE = 2;
const TRYING = 3;

const HUMAN = 0;
const COMPUTER = 1;

const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1],
                    [-1, -1], [1, 1], [1, -1], [-1, 1]];

const UINT32MAX = 4294967295;
const MIN_SCORE = -30000000;
const MAX_SCORE = 30000000;
const WIN_SCORE = 10000000;

const EMPTY = 0;
const ALPHA = 1;
const BETA = 2;
const EXACT = 3;

const ONGOING = 0;
const GAMEOVER = 1;

const toidx = (x, y) => ((x << PADDED_BOARD_WID_SHT) + y);
const idx2x = (idx) => (idx >> PADDED_BOARD_WID_SHT);
const idx2y = (idx) => (idx & PADDED_BOARD_WID_MSK);
const inboard = (x, y) => (x >= 0 && x < BOARD_WID && y >=0 && y < BOARD_WID)
