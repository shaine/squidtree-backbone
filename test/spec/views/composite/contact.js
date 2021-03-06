(function() {
    'use strict';

    var root = this;

    root.define([
            'views/composite/contact'
        ],
        function( ContactCollectionView ) {

            describe('ContactCollectionView Collectionview', function () {

                it('should be an instance of ContactCollectionView Collectionview', function () {
                    var contactCollectionView = new ContactCollectionView();
                    expect( contactCollectionView ).to.be.an.instanceOf( ContactCollectionView );
                });
            });

        });

}).call( this );
