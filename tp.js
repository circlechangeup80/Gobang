var TP = (function() {
    const HI = 1;
    const LO = 0;

    var curZobristVal = new Uint32Array(2);

    function hashItem(dep, score, flag) {
        this.checksum = new Uint32Array(2);
        this.update(dep, score, flag)
    }

    hashItem.prototype.update = function(dep, score, flag) {
        this.checksum[LO] = curZobristVal[LO];
        this.checksum[HI] = curZobristVal[HI];
        this.dep = dep;
        this.score = score;
        this.flag = flag;
    }

    function ZobristHash() {
        this.zobristBoard = [[], []];
        this.hashItems = new Array((1 << 16) + 1);
        this.zobristBoard[0].push(new Uint32Array(PADDED_BOARD_WID * PADDED_BOARD_WID));
        this.zobristBoard[0].push(new Uint32Array(PADDED_BOARD_WID * PADDED_BOARD_WID));
        this.zobristBoard[1].push(new Uint32Array(PADDED_BOARD_WID * PADDED_BOARD_WID));
        this.zobristBoard[1].push(new Uint32Array(PADDED_BOARD_WID * PADDED_BOARD_WID));

        for (let i = 0; i < this.hashItems.length; i++) {
            this.hashItems[i] = new hashItem(-1, -1, EMPTY);
        }
    }

    ZobristHash.prototype.insertHashItem = function(dep, score, flag) {
        let key = curZobristVal[LO] & 0xFFFF;
        if (this.hashItems[key].flag != EMPTY && this.hashItems[key].dep > dep) {
            return;
        } else {
            this.hashItems[key].update(dep, score, flag);
        }

    }

    ZobristHash.prototype.getHashItem = function() {
        let key = curZobristVal[LO] & 0xFFFF;
        let hashItem = this.hashItems[key];

        if (hashItem.flag != EMPTY) {
            if (hashItem.checksum[LO] == curZobristVal[LO] && hashItem.checksum[HI] == curZobristVal[HI]) {
                return hashItem;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    ZobristHash.prototype.update = function(piece, x, y) {
        curZobristVal[LO] ^= this.zobristBoard[piece][LO][toidx(x, y)];
        curZobristVal[HI] ^= this.zobristBoard[piece][HI][toidx(x, y)];
    }

    ZobristHash.prototype.reset = function() {
        curZobristVal[LO] = Math.random() * UINT32MAX;
        curZobristVal[HI] = Math.random() * UINT32MAX;

        for (let piece = 0; piece < 2; piece++) {
            for (let x = 0; x < BOARD_WID; x++) {
                for (let y = 0; y < BOARD_WID; y++) {
                    this.zobristBoard[piece][LO][toidx(x, y)] = Math.random() * UINT32MAX;
                    this.zobristBoard[piece][HI][toidx(x, y)] = Math.random() * UINT32MAX;
                }
            }
        }

        for (let i = 0; i < this.hashItems.length; i++) {
            this.hashItems[i].update(-1, -1, EMPTY);
        }
    }

    return {
        ZobristHash: ZobristHash
    };
}());

