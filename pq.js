var PQ = (function() {
    const paren = idx => (idx - 1) >> 1;
    const left = idx => (idx << 1) + 1;
    const right = idx => (idx << 1) + 2;
    
    function PriorityQueue(cap, compFunc) {
        this.cap = cap;
        this.hsize = 0;
        this.harr = new Array(this.cap);
        this.compFunc = compFunc;
    }

    function swapArrElement(arr, idx1, idx2) {
        let tmp = arr[idx1];
        arr[idx1] = arr[idx2];
        arr[idx2] = tmp;
    }

    PriorityQueue.prototype.insert = function(item) {
        if (this.hsize == this.cap) {
            console.log("Overflow: cannot insert the key!");
            return;
        }

        this.harr[this.hsize] = item; 
        this.hsize++;
        let i = this.hsize - 1;

        while (i != 0 && this.compFunc(this.harr[paren(i)].key, this.harr[i].key)) {
            swapArrElement(this.harr, paren(i), i);
            i = paren(i); 
        }
    }

    PriorityQueue.prototype.heapify = function(idx) {
        while (idx < this.hsize) {
            let select;

            if (left(idx) < this.hsize && this.compFunc(this.harr[idx].key, this.harr[left(idx)].key)) {
                select = left(idx);
            } else {
                select = idx;
            }
            if (right(idx) < this.hsize && this.compFunc(this.harr[select].key, this.harr[right(idx)].key)) {
                select = right(idx);
            }

            if (select != idx) {
                swapArrElement(this.harr, select, idx);
                idx = select;
            } else {
                break;
            }
        }
    }

    PriorityQueue.prototype.empty = function() {
        if (this.hsize == 0) return true;
        else return false;
    }

    PriorityQueue.prototype.pop = function() {
        if (this.hsize <= 0) {
            console.log("no element in the priority queue!");
            return null;
        }
        if (this.hsize == 1) {
            this.hsize--;
            return this.harr[0];
        }

        let root = this.harr[0];
        this.harr[0] = this.harr[this.hsize - 1];
        this.hsize--;
        this.heapify(0);

        return root;
    }

    PriorityQueue.prototype.showArr = function() {
        for (let i = 0; i < this.hsize; i++) {
            console.log(i, this.harr[i]); 
        }
    }

    PriorityQueue.prototype.traverse = function() {
        var idx = 0;
        
        this.showArr();
        var q = [];
        q.push(idx);
        while (q.length > 0) {
            idx = q.shift();
            if (left(idx) < this.hsize) {
                q.push(left(idx));
            }
            if (right(idx) < this.hsize) {
                q.push(right(idx));
            }
        }
    }

    return {
        PriorityQueue: PriorityQueue
    };
}());
