export {}

declare global {
    interface Array<T> {
        isEmpty(): boolean
        isNotEmpty(): boolean
        first(): T
        firstOrNull(): T | null
        firstIndex(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): number | null
        last(): T
        lastOrNull(): T | null
        lastIndex(predicate: (item: T) => boolean): number | null
        intersect(otherArray: T[]): T[]
        count(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): number
        none(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): boolean
        sortBy(keyGetter: (item: T) => unknown, descending?: boolean): Array<T>
        sortByMultiple(keyGetters: { key: ((item: T) => unknown), descending?: boolean }[]): Array<T>
        splitOn(separator: (value: T) => unknown): Array<Array<T>>
    }
}
Array.prototype.isEmpty = function(): boolean {
    return this.length == 0
}
Array.prototype.isNotEmpty = function(): boolean {
    return !this.isEmpty()
}
Array.prototype.first = function<T>(): T {
    if (this.length == 0) { throw (Error('Array contains no elements')) }
    return this[0]
}
Array.prototype.firstOrNull = function<T>(): T | null {
    if (this.length == 0) { return null }
    return this.first()
}
Array.prototype.firstIndex = function<T>(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): number | null {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const index = this.findIndex(predicate, thisArg)
    return index == -1 ? null : index
}
Array.prototype.last = function<T>(): T {
    if (this.length == 0) { throw (Error('Array contains no elements')) }
    return this[this.length - 1]
}
Array.prototype.lastOrNull = function<T>(): T | null {
    if (this.length == 0) { return null }
    return this.last()
}
Array.prototype.lastIndex = function<T>(predicate: (item: T) => boolean): number | null {
    for (let i = this.length - 1; i >= 0; i--) {
        if (predicate((this as T[])[i])) {
            return i
        }
    }
    return null
}
Array.prototype.intersect = function<T>(otherArray: T[]): T[] {
    return [...new Set(this.filter(i => new Set(otherArray).has(i as T)))] as T[]
}
Array.prototype.count = function<T>(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): number {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    return this.filter(predicate, thisArg).length
}
Array.prototype.none = function<T>(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    return !this.some(predicate, thisArg)
}
Array.prototype.sortBy = function<T, V>(keyGetter: (item: T) => V, descending: boolean = false): Array<T> {
    return this.sort((a: T, b: T) => {
        const keyA = keyGetter(a)
        const keyB = keyGetter(b)

        if (keyA < keyB) return descending ? 1 : -1
        if (keyA > keyB) return descending ? -1 : 1
        return 0
    })
}
Array.prototype.sortByMultiple = function<T, V>(keyGetters: { key: ((item: T) => V), descending?: boolean }[]): Array<T> {
    return this.sort((a: T, b: T) => {
        for (let i = 0; i < keyGetters.length; i++) {
            const keyA = keyGetters[i].key(a)
            const keyB = keyGetters[i].key(b)

            if (keyA < keyB) return keyGetters[i].descending == true ? 1 : -1
            if (keyA > keyB) return keyGetters[i].descending == true ? -1 : 1
        }
        return 0
    })

}

Array.prototype.splitOn = function<T, V>(separator: (item: T) => V): Array<Array<T>> {
    const result: T[][] = []
    let currentGroup: T[] = []

    this.forEach(element => {
        currentGroup.push(element as T)
        if (separator(element as T) == true) {
            result.push(currentGroup)
            currentGroup = []
        }
    })

    if (currentGroup.isNotEmpty()) {
        result.push(currentGroup)
    }

    return result
}

declare global {
    interface String {
        isEmpty(): boolean
        isNotEmpty(): boolean
    }
}
String.prototype.isEmpty = function(): boolean {
    return this.length == 0
}
String.prototype.isNotEmpty = function(): boolean {
    return !this.isEmpty()
}
// func ifEmpty(_ valueIfEmpty: String) -> String {
//     return isEmpty ? valueIfEmpty : self
// }
