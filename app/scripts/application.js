define([
    'backbone',
    'underscore',
    'communicator',
    'models/contact',
    'collections/contact',
    'collections/headers',
    'regions/dialog',
    'routers/contact-router',
    'routers/about-router',
    'controllers/header'
],

function( Backbone, _, Communicator, Contact, ContactCollection, HeaderCollection, ContactRegion, ContactRouter, AboutRouter, HeaderController ) {
    'use strict';

    var App = new Backbone.Marionette.Application();

    /* Add application regions here */
    App.addRegions({
        headerRegion: '#header-region',
        mainRegion: '#main-region',
        dialogRegion: ContactRegion.extend({
            el: '#dialog-region'
        })
    });

    App.navigate = function(route, options){
        if (!options) {
            options = {};
        }
        Backbone.history.navigate(route, options);
    };

    App.getCurrentRoute = function() {
        return Backbone.history.fragment;
    };

    /* Add initializers here */
    App.addInitializer( function() {
        var contactRouter = new ContactRouter();
        var aboutRouter = new AboutRouter();
        var headerController = new HeaderController();

        // Add a shift+click debugging tool to views
        var delegateEvents = Backbone.View.prototype.delegateEvents;
        Backbone.View.prototype.delegateEvents = function(a) {
            var _this = this;
            this.$el.on('click', function(e) {
                if (e.shiftKey) {
                    // Store all of the views we debug
                    if (typeof window.debuggedViews === 'undefined') {
                        window.debuggedViews = _([]);
                    }
                    window.debuggedViews.push(_this);

                    // Dump this view into the console
                    console.log(
                        'var ' + _this.cid + ' = debuggedViews.last() ',
                        window.debuggedViews.last()
                    );

                    // Add a reference to this view object to the window
                    // namespace so we can play around with it interactively
                    window[_this.cid] = _this;

                    // STAHP
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                } else {
                    return true;
                }
            });

            // Call the original delegateEvents() function from the context
            // of this object
            delegateEvents.call(this, a);
        };

        var contacts;
        var headers;

        var initializeContacts = function(){
            var contacts = new ContactCollection([
                { id: 1, firstName: 'Alice', lastName: 'Arten', phoneNumber: '555-0184' },
                { id: 2, firstName: 'Bob', lastName: 'Brigham', phoneNumber: '555-0163' },
                { id: 3, firstName: 'Charlie', lastName: 'Campbell', phoneNumber: '555-0129' }
            ]);

            contacts.forEach(function(contact) {
                contact.save();
            });

            return contacts.models;
        };

        var initializeHeaders = function() {
            var headers = new HeaderCollection([
                { name: 'Contacts', url: 'contacts', navigationTrigger: 'contacts:list' },
                { name: 'About', url: 'about', navigationTrigger: 'about:show' }
            ]);

            return headers;
        };

        var API = {
            getContactEntities: function(){
                var contacts = new ContactCollection();
                var defer = $.Deferred();
                setTimeout(function() {
                    contacts.fetch({
                        success: function(data) {
                            defer.resolve(data);
                        }
                    });
                }, 2000);

                var promise = defer.promise();
                $.when(promise).done(function(contacts) {
                    if (contacts.length === 0) {
                        var models = initializeContacts();
                        contacts.reset(models);
                    }
                });

                return defer.promise();
            },

            getContactEntity: function(id) {
                var contact = new Contact({id: id});
                var defer = $.Deferred();
                setTimeout(function() {
                    contact.fetch({
                        success: function(data) {
                            defer.resolve(data);
                        },
                        error: function(data) {
                            defer.resolve(undefined);
                        }
                    });
                }, 2000);

                return defer.promise();
            },

            getHeaders: function() {
                if(headers === undefined){
                    headers = initializeHeaders();
                }
                return headers;
            }
        };

        Communicator.reqres.setHandler('contact:entities', function() {
            return API.getContactEntities();
        });

        Communicator.reqres.setHandler('contact:entity', function(id) {
            return API.getContactEntity(id);
        });

        Communicator.reqres.setHandler('header:links', function(id) {
            return API.getHeaders();
        });

        Communicator.mediator.on('app:show', function(view) {
            App.mainRegion.show(view);
        });

        Communicator.mediator.on('app:dialog', function(view) {
            App.dialogRegion.show(view);
        });

        Communicator.mediator.on('app:header', function(view) {
            App.headerRegion.show(view);
        });

        Communicator.command.setHandler('set:active:header', function(name) {
            headerController.setActiveHeader(name);
        });

        headerController.listHeader();
    });

    App.on('initialize:after', function() {
        if (Backbone.history) {
            Backbone.history.start({
                pushState: true
            });

            if (this.getCurrentRoute() === '') {
                Communicator.mediator.trigger('contacts:list');
            }
        }

        Communicator.mediator.trigger('app:start');
    });

    return App;
});
