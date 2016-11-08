import RXBox from "../index";

describe('test RXBox Class', () => {
    beforeEach(() => {
        this._store = new RXBox();
        this._store.debug = true;
    });

    it('expect assign foo value to 1 and return 1 when try to get the state', () => {
        this._store.assignState({foo: 1});
        const foo = this._store.getState()['foo'];
        expect(foo).toBe(1);
    });

    it('expect watch to return 1', (done) => {
        this._store.watch('foo').subscribe(
            (val) => {
                expect(val).toBe(1);
                done();
            }
        );

        this._store.assignState({foo: 1});
    });
});