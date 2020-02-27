import { Observable, merge, of } from 'rxjs'
import { switchMap, scan, map } from 'rxjs/operators'

export interface ImmutableSet<T> extends Iterable<T> {
  add(value: T): ImmutableSet<T>
  delete(value: T): ImmutableSet<T>
}

/**
 * Acts as an RxJS operator. Given observables for added (A) and removed (R)
 * values, maps the first immutable set of values from a source observable (S)
 * to an observable yielding a new immutable set built by adding and removing
 * values as A and R yield values.
 *
 * S
 * |--v------------------------------------------------|
 *    |
 *  {1,2}
 *
 * A
 * |----------3-------------------4--------------------|
 *
 * R
 * |-------------------1--------------------3----------|
 *
 * mergeChanges(A, R)(S)
 * |--v-------v--------v----------v---------v----------|
 *    |       |        |          |         |
 *  {1,2}  {1,2,3}   {2,3}     {2,3,4}    {2,4}
 */
const mergeChanges = <T>(add: Observable<T>, remove: Observable<T>) => (
  source: Observable<ImmutableSet<T>>,
): Observable<ImmutableSet<T>> =>
  source.pipe(
    switchMap(initial =>
      merge(
        of(initial),
        merge(
          add.pipe(map(value => ({ add: value }))),
          remove.pipe(map(value => ({ remove: value }))),
        ).pipe(
          scan(
            (values, change) =>
              'add' in change
                ? values.add(change.add)
                : values.delete(change.remove),
            initial,
          ),
        ),
      ),
    ),
  )

export default mergeChanges
