( function ( oo, global ) {

	QUnit.module( 'core' );

	QUnit.test( 'inheritClass', 26, function ( assert ) {
		var foo, bar, key, enumKeys;

		function Foo() {
			this.constructedFoo = true;
		}

		Foo.a = 'prop of Foo';
		Foo.b = 'prop of Foo';
		Foo.prototype.b = 'proto of Foo';
		Foo.prototype.c = 'proto of Foo';
		Foo.prototype.bFn = function () {
			return 'proto of Foo';
		};
		Foo.prototype.cFn = function () {
			return 'proto of Foo';
		};

		foo = new Foo();

		function Bar() {
			Bar.parent.call( this );
			this.constructedBar = true;
		}
		oo.inheritClass( Bar, Foo );

		assert.deepEqual(
			Foo.static,
			{},
			'A "static" property (empty object) is automatically created if absent'
		);

		Foo.static.a = 'static of Foo';
		Foo.static.b = 'static of Foo';

		assert.notStrictEqual( Foo.static, Bar.static, 'Static property is not copied, but inheriting' );
		assert.strictEqual( Bar.static.a, 'static of Foo', 'Foo.static inherits from Bar.static' );

		Bar.static.b = 'static of Bar';

		assert.strictEqual( Foo.static.b, 'static of Foo', 'Change to Bar.static does not affect Foo.static' );

		Bar.a = 'prop of Bar';
		Bar.prototype.b = 'proto of Bar';
		Bar.prototype.bFn = function () {
			return 'proto of Bar';
		};

		assert.throws( function () {
			oo.inheritClass( Bar, Foo );
		}, 'Throw if target already inherits from source (from an earlier call)' );

		assert.throws( function () {
			oo.inheritClass( Bar, Object );
		}, 'Throw if target already inherits from source (naturally, Object)' );

		bar = new Bar();

		assert.strictEqual(
			Bar.b,
			undefined,
			'Constructor properties are not inherited'
		);

		assert.strictEqual(
			foo instanceof Foo,
			true,
			'foo instance of Foo'
		);
		assert.strictEqual(
			foo instanceof Bar,
			false,
			'foo not instance of Bar'
		);

		assert.strictEqual(
			bar instanceof Foo,
			true,
			'bar instance of Foo'
		);
		assert.strictEqual(
			bar instanceof Bar,
			true,
			'bar instance of Bar'
		);

		assert.strictEqual( foo.constructor, Foo, 'original constructor is unchanged' );
		assert.strictEqual( foo.constructedFoo, true, 'original constructor ran' );
		assert.strictEqual( foo.constructedBar, undefined, 'subclass did not modify parent class' );

		assert.strictEqual( bar.constructor, Bar, 'constructor property is restored' );
		assert.strictEqual( bar.constructor.parent, Foo, 'super property points to parent class' );
		assert.strictEqual( bar.constructedFoo, true, 'parent class ran through this.constructor.super' );
		assert.strictEqual( bar.constructedBar, true, 'original constructor ran' );
		assert.strictEqual( bar.b, 'proto of Bar', 'own methods go first' );
		assert.strictEqual( bar.bFn(), 'proto of Bar', 'own properties go first' );
		assert.strictEqual( bar.c, 'proto of Foo', 'prototype properties are inherited' );
		assert.strictEqual( bar.cFn(), 'proto of Foo', 'prototype methods are inherited' );

		assert.strictEqual( bar.constructor.parent, Foo, 'super property points to parent class' );

		enumKeys = [];
		for ( key in bar ) {
			enumKeys.push( key );
		}

		// In compliant ES3 and ES5 engines a property is enumerable by default, and to
		// make our restored constructor property unenumerable we'd need ES5.
		// In IE8 this happens to work because it has a bug where certain Object.prototype
		// keys that are unenumerable affect plain objects and thus it was never enumerable
		// to begin with.
		// https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
		assert.strictEqual(
			enumKeys.indexOf( 'constructor' ),
			-1,
			'The restored "constructor" property should not be enumerable'
		);

		Bar.prototype.dFn = function () {
			return 'proto of Bar';
		};
		Foo.prototype.dFn = function () {
			return 'proto of Foo';
		};
		Foo.prototype.eFn = function () {
			return 'proto of Foo';
		};

		assert.strictEqual( bar.dFn(), 'proto of Bar', 'inheritance is live (overwriting an inherited method)' );
		assert.strictEqual( bar.eFn(), 'proto of Foo', 'inheritance is live (adding a new method deeper in the chain)' );
	} );

	QUnit.test( 'mixinClass', 6, function ( assert ) {
		var quux;

		function Foo() {}
		oo.initClass( Foo );
		Foo.static.xFoo = true;
		Foo.prototype.isFoo = function () {
			return 'method of Foo';
		};

		function Bar() {}
		oo.inheritClass( Bar, Foo );
		Bar.static.xBar = true;
		Bar.prototype.isBar = function () {
			return 'method of Bar';
		};

		function Quux() {}
		oo.mixinClass( Quux, Bar );

		assert.strictEqual(
			Quux.prototype.isFoo,
			undefined,
			'method inherited by mixin is not copied over'
		);

		assert.strictEqual(
			Quux.static.xFoo,
			undefined,
			'static inherited by mixin is not copied over'
		);

		assert.strictEqual(
			Quux.prototype.constructor,
			Quux,
			'constructor property skipped'
		);

		assert.strictEqual(
			Quux.prototype.hasOwnProperty( 'isBar' ),
			true,
			'mixin method became own property'
		);

		assert.strictEqual(
			Quux.static.hasOwnProperty( 'xBar' ),
			true,
			'mixin static property became own property'
		);

		quux = new Quux();

		assert.strictEqual( quux.isBar(), 'method of Bar', 'method works as expected' );
	} );

	( function () {
		function testGetSetProp( type, obj ) {
			QUnit.test( 'getProp( ' + type + ' )', 9, function ( assert ) {
				assert.strictEqual(
					oo.getProp( obj, 'foo' ),
					3,
					'single key'
				);
				assert.deepEqual(
					oo.getProp( obj, 'bar' ),
					{ baz: null, quux: { whee: 'yay' } },
					'single key, returns object'
				);
				assert.strictEqual(
					oo.getProp( obj, 'bar', 'baz' ),
					null,
					'two keys, returns null'
				);
				assert.strictEqual(
					oo.getProp( obj, 'bar', 'quux', 'whee' ),
					'yay',
					'three keys'
				);
				assert.strictEqual(
					oo.getProp( obj, 'x' ),
					undefined,
					'missing property returns undefined'
				);
				assert.strictEqual(
					oo.getProp( obj, 'foo', 'bar' ),
					undefined,
					'missing 2nd-level property returns undefined'
				);
				assert.strictEqual(
					oo.getProp( obj, 'foo', 'bar', 'baz', 'quux', 'whee' ),
					undefined,
					'multiple missing properties don\'t cause an error'
				);
				assert.strictEqual(
					oo.getProp( obj, 'bar', 'baz', 'quux' ),
					undefined,
					'accessing property of null returns undefined, doesn\'t cause an error'
				);
				assert.strictEqual(
					oo.getProp( obj, 'bar', 'baz', 'quux', 'whee', 'yay' ),
					undefined,
					'accessing multiple properties of null'
				);
			} );

			QUnit.test( 'setProp( ' + type + ' )', 7, function ( assert ) {
				oo.setProp( obj, 'foo', 4 );
				assert.strictEqual( 4, obj.foo, 'setting an existing key with depth 1' );

				oo.setProp( obj, 'test', 'TEST' );
				assert.strictEqual( 'TEST', obj.test, 'setting a new key with depth 1' );

				oo.setProp( obj, 'bar', 'quux', 'whee', 'YAY' );
				assert.strictEqual( 'YAY', obj.bar.quux.whee, 'setting an existing key with depth 3' );

				oo.setProp( obj, 'bar', 'a', 'b', 'c' );
				assert.strictEqual( 'c', obj.bar.a.b, 'setting two new keys within an existing key' );

				oo.setProp( obj, 'a', 'b', 'c', 'd', 'e', 'f' );
				assert.strictEqual( 'f', obj.a.b.c.d.e, 'setting new keys with depth 5' );

				oo.setProp( obj, 'bar', 'baz', 'whee', 'wheee', 'wheeee' );
				assert.strictEqual( null, obj.bar.baz, 'descending into null fails silently' );

				oo.setProp( obj, 'foo', 'bar', 5 );
				assert.strictEqual( 4, obj.foo, 'descending into primitive (number) preserves fails silently' );
			} );
		}

		var plainObj, funcObj, arrObj;
		plainObj = {
			foo: 3,
			bar: {
				baz: null,
				quux: {
					whee: 'yay'
				}
			}
		};
		funcObj = function abc( d ) { return d; };
		funcObj.foo = 3;
		funcObj.bar = {
			baz: null,
			quux: {
				whee: 'yay'
			}
		};
		arrObj = [ 'a', 'b', 'c' ];
		arrObj.foo = 3;
		arrObj.bar = {
			baz: null,
			quux: {
				whee: 'yay'
			}
		};

		testGetSetProp( 'Object', plainObj );
		testGetSetProp( 'Function', funcObj );
		testGetSetProp( 'Array', arrObj );
	}() );

	QUnit.test( 'cloneObject', 4, function ( assert ) {
		var myfoo, myfooClone, expected;

		function Foo( x ) {
			this.x = x;
		}
		Foo.prototype.x = 'default';
		Foo.prototype.aFn = function () {
			return 'proto of Foo';
		};

		myfoo = new Foo( 10 );
		myfooClone = oo.cloneObject( myfoo );

		assert.notStrictEqual( myfoo, myfooClone, 'clone is not equal when compared by reference' );
		assert.deepEqual( myfoo, myfooClone, 'clone is equal when recursively compared by value' );

		expected = {
			x: 10,
			aFn: 'proto of Foo',
			constructor: Foo,
			instanceOf: true,
			own: {
				x: true,
				aFn: false,
				constructor: false
			}
		};

		assert.deepEqual(
			{
				x: myfoo.x,
				aFn: myfoo.aFn(),
				constructor: myfoo.constructor,
				instanceOf: myfoo instanceof Foo,
				own: {
					x: myfoo.hasOwnProperty( 'x' ),
					aFn: myfoo.hasOwnProperty( 'aFn' ),
					constructor: myfoo.hasOwnProperty( 'constructor' )
				}
			},
			expected,
			'original looks as expected'
		);

		assert.deepEqual(
			{
				x: myfooClone.x,
				aFn: myfooClone.aFn(),
				constructor: myfooClone.constructor,
				instanceOf: myfooClone instanceof Foo,
				own: {
					x: myfooClone.hasOwnProperty( 'x' ),
					aFn: myfooClone.hasOwnProperty( 'aFn' ),
					constructor: myfoo.hasOwnProperty( 'constructor' )
				}
			},
			expected,
			'clone looks as expected'
		);

	} );

	QUnit.test( 'getObjectValues', 6, function ( assert ) {
		var tmp;

		assert.deepEqual(
			oo.getObjectValues( { a: 1, b: false, foo: 'bar' } ),
			[ 1, false, 'bar' ],
			'Plain object with primitive values'
		);
		assert.deepEqual(
			oo.getObjectValues( [ 1, false, 'bar' ] ),
			[ 1, false, 'bar' ],
			'Array with primitive values'
		);

		tmp = function () {
			this.isTest = true;

			return this;
		};
		tmp.a = 1;
		tmp.b = false;
		tmp.foo = 'bar';

		assert.deepEqual(
			oo.getObjectValues( tmp ),
			[ 1, false, 'bar' ],
			'Function with properties'
		);

		tmp = Object.create( { a: 1, b: false, foo: 'bar' } );
		tmp.b = true;
		tmp.bar = 'quux';

		assert.deepEqual(
			oo.getObjectValues( tmp ),
			[ true, 'quux' ],
			'Only own properties'
		);

		assert.throws(
			function () {
				oo.getObjectValues( 'hello' );
			},
			/^TypeError/,
			'Throw exception for non-object (string)'
		);

		assert.throws(
			function () {
				oo.getObjectValues( null );
			},
			/^TypeError/,
			'Throw exception for non-object (null)'
		);
	} );

	QUnit.test( 'compare', 26, function ( assert ) {
		var x, y, z;

		assert.strictEqual(
			oo.compare( [], [] ),
			true,
			'Empty array'
		);

		assert.strictEqual(
			oo.compare( {}, {} ),
			true,
			'Empty plain object'
		);

		assert.strictEqual(
			oo.compare( {}, null ),
			true,
			'Empty plain object against null'
		);

		assert.strictEqual(
			oo.compare( {}, undefined ),
			true,
			'Empty plain object against undefined'
		);

		assert.strictEqual(
			oo.compare( null, {} ),
			true,
			'Null against empty plain object'
		);

		assert.strictEqual(
			oo.compare( [ 1, 2, undefined ], [ 1, 2 ] ),
			true,
			'Implicit undefined against explicit undefined'
		);

		assert.strictEqual(
			oo.compare( [], [ undefined ] ),
			true,
			'Implicit undefined against explicit undefined (empty array)'
		);

		assert.strictEqual(
			oo.compare( { a: 1 }, null ),
			false,
			'Plain object against null'
		);

		assert.strictEqual(
			oo.compare( { a: 1 }, undefined ),
			false,
			'Plain object against null'
		);

		assert.strictEqual(
			oo.compare( [ undefined ], [ undefined ] ),
			true,
			'Undefined in array'
		);

		assert.strictEqual(
			oo.compare( [ null ], [ null ] ),
			true,
			'Null in array'
		);

		assert.strictEqual(
			oo.compare( [ true ], [ true ] ),
			true,
			'boolean in array'
		);

		assert.strictEqual(
			oo.compare( [ true ], [ false ] ),
			false,
			'different booleans in array'
		);

		assert.strictEqual(
			oo.compare( [ 42 ], [ 42 ] ),
			true,
			'number in array'
		);

		assert.strictEqual(
			oo.compare( [ 42 ], [ 32 ] ),
			false,
			'different number in array'
		);

		assert.strictEqual(
			oo.compare( [ 'foo' ], [ 'foo' ] ),
			true,
			'string in array'
		);

		assert.strictEqual(
			oo.compare( [ 'foo' ], [ 'bar' ] ),
			false,
			'different string in array'
		);

		assert.strictEqual(
			oo.compare( [], {} ),
			true,
			'Empty array equals empty plain object'
		);

		assert.strictEqual(
			oo.compare( { a: 5 }, { a: 5, b: undefined } ),
			true,
			'Missing key and undefined are treated the same'
		);

		assert.strictEqual(
			oo.compare(
				{
					foo: [ true, 42 ],
					bar: [ {
						x: {},
						y: [ 'test' ]
					} ]
				},
				{
					foo: [ true, 42 ],
					bar: [ {
						x: {},
						y: [ 'test' ]
					} ]
				}
			),
			true,
			'Nested structure with no difference'
		);

		x = { a: 1 };

		assert.strictEqual(
			oo.compare( x, x ),
			true,
			'Compare object to itself'
		);

		x = Object.create( { foo: 1, map: function () { } } );
		x.foo = 2;
		x.bar = true;

		assert.strictEqual(
			oo.compare( x, { foo: 2, bar: true } ),
			true,
			'Ignore inherited properties and methods of a'
		);

		assert.strictEqual(
			oo.compare( { foo: 2, bar: true }, x ),
			true,
			'Ignore inherited properties and methods of b'
		);

		assert.strictEqual(
			oo.compare(
				{
					foo: [ true, 42 ],
					bar: [ {
						x: {},
						y: [ 'test' ]
					} ]
				},
				{
					foo: [ 1, 42 ],
					bar: [ {
						x: {},
						y: [ 'test' ]
					} ]
				}
			),
			false,
			'Nested structure with difference'
		);

		// Give each function a different number of specified arguments to
		// also change the 'length' property of a function.

		x = function X( a ) {
			this.name = a || 'X';
		};
		x.foo = [ true ];

		y = function Y( a, b ) {
			this.name = b || 'Y';
		};
		y.foo = [ true ];

		z = function Z( a, b, c ) {
			this.name = c || 'Z';
		};
		z.foo = [ 1 ];

		// oo.compare ignores the function body. It treats them
		// like regular object containers.
		assert.strictEqual(
			oo.compare( x, y ),
			true,
			'Different functions with the same properties'
		);

		assert.strictEqual(
			oo.compare( x, z ),
			false,
			'Different functions with different properties'
		);
	} );

	QUnit.test( 'compare( Object, Object, Boolean asymmetrical )', 4, function ( assert ) {
		var x, y, z;

		x = {
			foo: [ true, 42 ],
			baz: undefined
		};
		y = {
			foo: [ true, 42, 10 ],
			bar: [ {
				x: {},
				y: [ 'test' ]
			} ],
			baz: 1701
		};
		z = {
			foo: [ 1, 42 ],
			bar: [ {
				x: {},
				y: [ 'test' ]
			} ],
			baz: 1701
		};

		assert.strictEqual(
			oo.compare( x, y, false ),
			false,
			'A subset of B (asymmetrical: false)'
		);

		assert.strictEqual(
			oo.compare( x, y, true ),
			true,
			'A subset of B (asymmetrical: true)'
		);

		assert.strictEqual(
			oo.compare( x, z, true ),
			false,
			'A subset of B with differences (asymmetrical: true)'
		);

		assert.strictEqual(
			oo.compare( [ undefined, 'val2' ], [ 'val1', 'val2', 'val3' ], true ),
			true,
			'A subset of B with sparse array'
		);
	} );

	QUnit.test( 'copy( source )', 14, function ( assert ) {
		var simpleObj = { foo: 'bar', baz: 3, quux: null, truth: true, falsehood: false },
			simpleArray = [ 'foo', 3, true, false ],
			withObj = [ { bar: 'baz', quux: 3 }, 5, null ],
			withArray = [ [ 'a', 'b' ], [ 1, 3, 4 ] ],
			sparseArray = [ 'a', undefined, undefined, 'b' ],
			withSparseArray = [ [ 'a', undefined, undefined, 'b' ] ],
			withFunction = [ function () { return true; } ];

		function Cloneable( name ) {
			this.name = name;
		}
		Cloneable.prototype.clone = function () {
			return new Cloneable( this.name + '-clone' );
		};

		function Thing( id ) {
			this.id = id;

			// Create a trap here to make sure we explode if
			// oo.copy tries to copy non-plain objects.
			this.child = {
				parent: this
			};
		}

		assert.deepEqual(
			oo.copy( simpleObj ),
			simpleObj,
			'Simple object'
		);

		assert.deepEqual(
			oo.copy( simpleArray ),
			simpleArray,
			'Simple array'
		);

		assert.deepEqual(
			oo.copy( withObj ),
			withObj,
			'Nested object'
		);

		assert.deepEqual(
			oo.copy( withArray ),
			withArray,
			'Nested array'
		);

		assert.deepEqual(
			oo.copy( sparseArray ),
			sparseArray,
			'Sparse array'
		);

		assert.deepEqual(
			oo.copy( withSparseArray ),
			withSparseArray,
			'Nested sparse array'
		);

		assert.deepEqual(
			oo.copy( withFunction ),
			withFunction,
			'Nested function'
		);

		assert.deepEqual(
			oo.copy( new Cloneable( 'bar' ) ),
			new Cloneable( 'bar-clone' ),
			'Cloneable object'
		);

		assert.deepEqual(
			oo.copy( { x: new Cloneable( 'bar' ) } ),
			{ x: new Cloneable( 'bar-clone' ) },
			'Nested Cloneable object'
		);

		assert.deepEqual(
			oo.copy( [ new Thing( 42 ) ] ),
			[ new Thing( 42 ) ]
		);

		assert.deepEqual(
			oo.copy ( null ),
			null,
			'Copying null'
		);

		assert.deepEqual(
			oo.copy ( undefined ),
			undefined,
			'Copying undefined'
		);

		assert.deepEqual(
			oo.copy ( { a: null, b: undefined } ),
			{ a: null, b: undefined },
			'Copying objects with null and undefined fields'
		);

		assert.deepEqual(
			oo.copy ( [ null, undefined ] ),
			[ null, undefined ],
			'Copying arrays with null and undefined elements'
		);

	} );

	QUnit.test( 'copy( source, Function leafCallback )', 3, function ( assert ) {
		function Cloneable( name ) {
			this.name = name;
			this.clone = function () {
				return new Cloneable( this.name + '-clone' );
			};
		}

		assert.deepEqual(
			oo.copy(
				{ foo: 'bar', baz: [ 1 ], bat: null, bar: undefined },
				function ( val ) {
					return 'mod-' + val;
				}
			),
			{ foo: 'mod-bar', baz: [ 'mod-1' ], bat: 'mod-null', bar: 'mod-undefined' },
			'Callback on primitive values'
		);

		assert.deepEqual(
			oo.copy(
				new Cloneable( 'callback' ),
				function ( val ) {
					val.name += '-mod';
					return val;
				}
			),
			new Cloneable( 'callback-clone-mod' ),
			'Callback on cloneables (top-level)'
		);

		assert.deepEqual(
			oo.copy(
				[ new Cloneable( 'callback' ) ],
				function ( val ) {
					val.name += '-mod';
					return val;
				}
			),
			[ new Cloneable( 'callback-clone-mod' ) ],
			'Callback on cloneables (as array elements)'
		);
	} );

	QUnit.test( 'copy( source, Function leafCallback, Function nodeCallback )', 2, function ( assert ) {
		function Cloneable( name ) {
			this.name = name;
			this.clone = function () {
				return new Cloneable( this.name + '-clone' );
			};
		}

		assert.deepEqual(
			oo.copy(
				{ foo: 'bar', baz: [ 1 ], bat: null, bar: undefined },
				function ( val ) {
					return 'mod-' + val;
				},
				function ( val ) {
					if ( Array.isArray( val ) ) {
						return [ 2 ];
					}
					if ( val === undefined ) {
						return '!';
					}
				}
			),
			{ foo: 'mod-bar', baz: [ 2 ], bat: 'mod-null', bar: '!' },
			'Callback to override array clone'
		);

		assert.deepEqual(
			oo.copy(
				[
					new Cloneable( 'callback' ),
					new Cloneable( 'extension' )
				],
				function ( val ) {
					val.name += '-mod';
					return val;
				},
				function ( val ) {
					if ( val && val.name === 'extension' ) {
						return { type: 'extension' };
					}
				}
			),
			[ new Cloneable( 'callback-clone-mod' ), { type: 'extension' } ],
			'Extension callback overriding cloneables'
		);
	} );

	QUnit.test( 'getHash: Basic usage', 7, function ( assert ) {
		var tmp, key,
			cases = {},
			hash = '{"a":1,"b":1,"c":1}',
			customHash = '{"first":1,"last":1}';

		cases['a-z literal'] = {
			object: {
				a: 1,
				b: 1,
				c: 1
			},
			hash: hash
		};

		cases['z-a literal'] = {
			object: {
				c: 1,
				b: 1,
				a: 1
			},
			hash: hash
		};

		tmp = {};
		cases['a-z augmented'] = {
			object: tmp,
			hash: hash
		};
		tmp.a = 1;
		tmp.b = 1;
		tmp.c = 1;

		tmp = {};
		cases['z-a augmented'] = {
			object: tmp,
			hash: hash
		};
		tmp.c = 1;
		tmp.b = 1;
		tmp.a = 1;

		cases['custom hash'] = {
			object: {
				getHashObject: function () {
					return {
						first: 1,
						last: 1
					};
				}
			},
			hash: customHash
		};

		cases['custom hash reversed'] = {
			object: {
				getHashObject: function () {
					return {
						last: 1,
						first: 1
					};
				}
			},
			hash: customHash
		};

		for ( key in cases ) {
			assert.strictEqual(
				oo.getHash( cases[key].object ),
				cases[key].hash,
				key + ': object has expected hash, regardless of "property order"'
			);
		}

		// .. and that something completely different is in face different
		// (just incase getHash is broken and always returns the same)
		assert.notStrictEqual(
			oo.getHash( { a: 2, b: 2 } ),
			hash,
			'A different object has a different hash'
		);
	} );

	QUnit.test( 'getHash: Complex usage', 2, function ( assert ) {
		var obj, hash;

		obj = {
			a: 1,
			b: 1,
			c: 1,
			// Nested array
			d: [ 'x', 'y', 'z' ],
			e: {
				a: 2,
				b: 2,
				c: 2
			}
		};

		assert.strictEqual(
			oo.getHash( obj ),
			'{"a":1,"b":1,"c":1,"d":["x","y","z"],"e":{"a":2,"b":2,"c":2}}',
			'Object with nested array and nested object'
		);

		// Include a circular reference
		/*
		 * PhantomJS hangs when calling JSON.stringify with an object containing a
		 * circular reference (https://github.com/ariya/phantomjs/issues/11206).
		 * We know latest Chrome/Firefox and IE8+ support this. So, for the sake of
		 * having qunit/phantomjs work, lets disable this for now.
		obj.f = obj;

		assert.throws( function () {
			oo.getHash( obj );
		}, 'Throw exceptions for objects with cirular references ' );
		*/

		function Foo() {
			this.a = 1;
			this.c = 3;
			this.b = 2;
		}

		hash = '{"a":1,"b":2,"c":3}';

		assert.strictEqual(
			oo.getHash( new Foo() ),
			hash,
			// This was previously broken when we used .constructor === Object
			// oo.getHash.keySortReplacer, because although instances of Foo
			// do inherit from Object (( new Foo() ) instanceof Object === true),
			// direct comparison would return false.
			'Treat objects constructed by a function as well'
		);
	} );

	if ( global.document ) {
		QUnit.test( 'getHash( iframe Object )', 1, function ( assert ) {
			var obj, hash;

			QUnit.tmpIframe( function ( iframe, teardown ) {
				obj = new iframe.contentWindow.Object();
				obj.c = 3;
				obj.b = 2;
				obj.a = 1;

				hash = '{"a":1,"b":2,"c":3}';

				assert.strictEqual(
					oo.getHash( obj ),
					hash,
					// This was previously broken when we used comparison with "Object" in
					// oo.getHash.keySortReplacer, because they are an instance of the other
					// window's "Object".
					'Treat objects constructed by a another window as well'
				);

				teardown();
			} );
		} );
	}

	QUnit.test( 'simpleArrayUnion', 5, function ( assert ) {

		assert.deepEqual(
			oo.simpleArrayUnion( [] ),
			[],
			'Empty'
		);

		assert.deepEqual(
			oo.simpleArrayUnion( [ 'a', 'b', 'a' ] ),
			[ 'a', 'b' ],
			'Single array with dupes'
		);

		assert.deepEqual(
			oo.simpleArrayUnion( [ 'a', 'b', 'a' ], [ 'c', 'd', 'c' ] ),
			[ 'a', 'b', 'c', 'd' ],
			'Multiple arrays with their own dupes'
		);

		assert.deepEqual(
			oo.simpleArrayUnion( [ 'a', 'b', 'a', 'c' ], [ 'c', 'd', 'c', 'a' ] ),
			[ 'a', 'b', 'c', 'd' ],
			'Multiple arrays with mixed dupes'
		);

		// Implementation detail, tested to ensure it is not
		// changed unintentinally.
		assert.deepEqual(
			oo.simpleArrayUnion(
				[ 1, 2, 1, 2, true, { a: 1 } ],
				[ 3, 3, 2, 1, false, { b: 2 } ]
			),
			[ 1, 2, true, { a: 1 }, 3, false ],
			'Values should be strings. Original value is preserved but compared as string'
		);

	} );

	QUnit.test( 'simpleArrayIntersection', 2, function ( assert ) {

		assert.deepEqual(
			oo.simpleArrayIntersection( [], [] ),
			[],
			'Empty'
		);

		assert.deepEqual(
			oo.simpleArrayIntersection(
				[ 'a', 'b', 'c', 'a' ],
				[ 'b', 'c', 'd', 'c' ]
			),
			[ 'b', 'c' ],
			'Simple'
		);

	} );

	QUnit.test( 'simpleArrayDifference', 2, function ( assert ) {

		assert.deepEqual(
			oo.simpleArrayDifference( [], [] ),
			[],
			'Empty'
		);

		assert.deepEqual(
			oo.simpleArrayDifference(
				[ 'a', 'b', 'c', 'a' ],
				[ 'b', 'c', 'd', 'c' ]
			),
			[ 'a', 'a' ],
			'Simple'
		);

	} );

}( OO, this ) );
