/**
 * Test over the Slack endpoint
 * Created by lefunes on 20/09/16.
 */
"use strict"; // ECMAScript 5's strict mode

//Require the dev-dependencies
const chai = require('chai'),
    chaiHttp = require('chai-http'),
    should = chai.should(),
    nock = require('nock');

chai.use(chaiHttp);

const endpoint = require('../endpoint');
const esApi = process.env._endpoints_services_api !== undefined ? process.env._endpoints_services_api : 'https://endpoints-services/api';
const esToken = process.env._endpoints_services_token !== undefined ? process.env._endpoints_services_token : '';
const defaultHeaders = {
    "endpointsservicestoken": esToken
};

// Slack service constants
const TEAM_NAME = 'Idea2';
const TEAM_ID = 'T0282KTTH';
const TEAM_URL = 'https://idea2.slack.com/';
const USER_TESTBOT_NAME = 'testbot';
const USER_TESTBOT_ID = 'U053J9W0H';
const CHANNEL_TEST_NAME_SIMPLE = 'test';
const CHANNEL_TEST_NAME = '#'+CHANNEL_TEST_NAME_SIMPLE;
const CHANNEL_TEST_ID = 'C04KXCMF8';
const GROUP_TEST_NAME = 'test-group';
const GROUP_TEST_ID = 'G06GL8VBK';

let startingTests = false;

// execute tests
const executeTests = () => {
    console.log('STARTING TESTS');
    startingTests = true;

    // Base tests
    describe('Platform REST services', () => {
        describe('System - Alive', () => {
            it('it should be started', (done) => {
                chai.request(endpoint)
                    .get('/api/system/alive')
                    .end((err, res) => {
                        //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        // started?
                        res.body.should.have.property('started');
                        res.body.started.should.to.be.true;
                        done();
                    });
            });
        });
        describe('System - Terminate', () => {
            it('it should be rejected without token', (done) => {
                chai.request(endpoint)
                    .get('/api/system/terminate')
                    .end((err, res) => {
                        //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                        res.should.have.status(401);
                        res.text.should.eql('Invalid token');
                        done();
                    });
            });
        });
        describe('Functions', () => {
            it('it should require token', (done) => {
                chai.request(endpoint)
                    .post('/api/function')
                    .send({})
                    .end((err, res) => {
                        //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        // endpoint exception
                        res.body.should.have.property('date');
                        res.body.date.should.be.a('number');
                        res.body.should.have.property('data');
                        res.body.data.should.be.a('object');
                        res.body.data.should.have.property('__endpoint_exception__');
                        res.body.data.__endpoint_exception__.should.to.be.true;
                        res.body.data.should.have.property('message');
                        res.body.data.message.should.eql('Invalid token');

                        done();
                    });
            });
            it('valid token, empty function name', (done) => {
                chai.request(endpoint)
                    .post('/api/function')
                    .set(defaultHeaders)
                    .send({})
                    .end((err, res) => {
                        //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        // endpoint exception
                        res.body.should.have.property('date');
                        res.body.date.should.be.a('number');
                        res.body.should.have.property('data');
                        res.body.data.should.be.a('object');
                        res.body.data.should.have.property('__endpoint_exception__');
                        res.body.data.__endpoint_exception__.should.to.be.true;
                        res.body.data.should.have.property('message');
                        res.body.data.message.should.eql('Empty function name');

                        done();
                    });
            });
            it('valid token, invalid function name', (done) => {
                chai.request(endpoint)
                    .post('/api/function')
                    .set(defaultHeaders)
                    .send({
                        function: 'invalidFunctionName'
                    })
                    .end((err, res) => {
                        //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        // endpoint exception
                        res.body.should.have.property('date');
                        res.body.date.should.be.a('number');
                        res.body.should.have.property('data');
                        res.body.data.should.be.a('object');
                        res.body.data.should.have.property('__endpoint_exception__');
                        res.body.data.__endpoint_exception__.should.to.be.true;
                        res.body.data.should.have.property('message');
                        res.body.data.message.should.eql('Invalid function name [invalidFunctionName]');

                        done();
                    });
            });
        });
    });

    // Endpoint functions
    describe('Built-in functions', () => {
        describe('Conversions', () => {
            describe('Convert Team', () => {
                it('it should require a key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTeam'
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('it should require a non-empty key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTeam',
                            params: {
                                key: ''
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('invalid key, null value', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTeam',
                            params: {
                                key: 'ABC123'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // null value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql('ABC123');
                            res.body.data.should.have.property('value');
                            should.not.exist(res.body.data.value);

                            done();
                        });
                });
                it('should convert TEAM_ID to TEAM_NAME', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTeam',
                            params: {
                                key: TEAM_ID
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // check value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql(TEAM_ID);
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql(TEAM_NAME);

                            done();
                        });
                });
            });
            describe('Convert User', () => {
                it('it should require a key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertUser'
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('it should require a non-empty key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertUser',
                            params: {
                                key: ''
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('invalid key, null value', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertUser',
                            params: {
                                key: 'ABC123'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // null value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql('ABC123');
                            res.body.data.should.have.property('value');
                            should.not.exist(res.body.data.value);

                            done();
                        });
                });
                it('should convert USER_TESTBOT_ID to USER_TESTBOT_ID', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertUser',
                            params: {
                                key: USER_TESTBOT_ID
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql(USER_TESTBOT_ID);
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql(USER_TESTBOT_NAME);

                            done();
                        });
                });
            });
            describe('Convert Channel', () => {
                it('it should require a key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertChannel'
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('it should require a non-empty key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertChannel',
                            params: {
                                key: ''
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('invalid key, null value', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertChannel',
                            params: {
                                key: 'ABC123'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // null value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql('ABC123');
                            res.body.data.should.have.property('value');
                            should.not.exist(res.body.data.value);

                            done();
                        });
                });
                it('should convert CHANNEL_TEST_ID to CHANNEL_TEST_NAME', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertChannel',
                            params: {
                                key: CHANNEL_TEST_ID
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql(CHANNEL_TEST_ID);
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql(CHANNEL_TEST_NAME);

                            done();
                        });
                });
                it('should convert GROUP_TEST_ID to GROUP_TEST_NAME', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertChannel',
                            params: {
                                key: GROUP_TEST_ID
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql(GROUP_TEST_ID);
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql(GROUP_TEST_NAME);

                            done();
                        });
                });
            });
            describe('Convert Timestamp', () => {
                it('it should require a key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTimestamp'
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('it should require a non-empty key', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTimestamp',
                            params: {
                                key: ''
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty key");

                            done();
                        });
                });
                it('invalid key, null value', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTimestamp',
                            params: {
                                key: 'ABCDEFG'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // invalid value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql('ABCDEFG');
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql('Invalid date');

                            done();
                        });
                });
                it('should convert Float', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTimestamp',
                            params: {
                                key: 1489686941.811434
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql(1489686941.811434);
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql('1489686941');

                            done();
                        });
                });
                it('should convert String', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__convertTimestamp',
                            params: {
                                key: '1489686941.811434'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            // value for the key
                            res.body.data.should.have.property('key');
                            res.body.data.key.should.eql('1489686941.811434');
                            res.body.data.should.have.property('value');
                            res.body.data.value.should.eql('1489686941');

                            done();
                        });
                });
            });
        });

        describe('Generic requests to API', () => {
            describe('__request', () => {
                it('it should require a path', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request'
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty path");

                            done();
                        });
                });
                it('it should require a non-empty path', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: ''
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.eql("Empty path");

                            done();
                        });
                });
                it('invalid Slack method', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'invalid.test'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.to.contain("unknown_method");

                            done();
                        });
                });
                it('auth.test', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'auth.test'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // auth.test
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('team_id');
                            res.body.data.team_id.should.eql(TEAM_ID);
                            res.body.data.should.have.property('team');
                            res.body.data.team.should.eql(TEAM_NAME);
                            res.body.data.should.have.property('url');
                            res.body.data.url.should.eql(TEAM_URL);
                            res.body.data.should.have.property('user_id');
                            res.body.data.user_id.should.eql(USER_TESTBOT_ID);
                            res.body.data.should.have.property('user');
                            res.body.data.user.should.eql(USER_TESTBOT_NAME);

                            done();
                        });
                });
                it('channels.list', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'channels.list'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // channels.list
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('channels');
                            res.body.data.channels.should.be.a('array');
                            res.body.data.channels.length.should.to.be.not.empty;
                            // channel
                            res.body.data.channels[0].should.be.a('object');
                            res.body.data.channels[0].should.have.property('id');
                            res.body.data.channels[0].id.should.be.a('string');
                            res.body.data.channels[0].should.have.property('name');
                            res.body.data.channels[0].name.should.be.a('string');

                            done();
                        });
                });
                it('groups.list', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'groups.list'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // groups.list
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('groups');
                            res.body.data.groups.should.be.a('array');
                            res.body.data.groups.length.should.to.be.not.empty;
                            // group
                            res.body.data.groups[0].should.be.a('object');
                            res.body.data.groups[0].should.have.property('id');
                            res.body.data.groups[0].id.should.be.a('string');
                            res.body.data.groups[0].should.have.property('name');
                            res.body.data.groups[0].name.should.be.a('string');

                            done();
                        });
                });
                it('im.list', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'im.list'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // im.list
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('ims');
                            res.body.data.ims.should.be.a('array');
                            res.body.data.ims.length.should.to.be.not.empty;
                            // im
                            res.body.data.ims[0].should.be.a('object');
                            res.body.data.ims[0].should.have.property('id');
                            res.body.data.ims[0].id.should.be.a('string');
                            res.body.data.ims[0].should.have.property('user');
                            res.body.data.ims[0].user.should.be.a('string');

                            done();
                        });
                });
                it('users.list', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'users.list'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // users.list
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('members');
                            res.body.data.members.should.be.a('array');
                            res.body.data.members.length.should.to.be.not.empty;
                            // group
                            res.body.data.members[0].should.be.a('object');
                            res.body.data.members[0].should.have.property('id');
                            res.body.data.members[0].id.should.be.a('string');
                            res.body.data.members[0].should.have.property('name');
                            res.body.data.members[0].name.should.be.a('string');

                            done();
                        });
                });
                it('channels.info (no channel)', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'channels.info'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.to.contain("channel_not_found");

                            done();
                        });
                });
                it('channels.info', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'channels.info',
                                params:{
                                    channel: CHANNEL_TEST_ID
                                }
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // group.info
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('channel');
                            res.body.data.channel.should.be.a('object');
                            res.body.data.channel.should.have.property('id');
                            res.body.data.channel.id.should.be.a('string');
                            res.body.data.channel.id.should.eql(CHANNEL_TEST_ID);
                            res.body.data.channel.should.have.property('name');
                            res.body.data.channel.name.should.be.a('string');
                            res.body.data.channel.name.should.eql(CHANNEL_TEST_NAME_SIMPLE);

                            done();
                        });
                });
                it('groups.info (no group)', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'groups.info'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.to.contain("channel_not_found");

                            done();
                        });
                });
                it('groups.info', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'groups.info',
                                params:{
                                    channel: GROUP_TEST_ID
                                }
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            // group.info
                            res.body.data.should.not.have.property('__endpoint_exception__');
                            res.body.data.should.have.property('ok');
                            res.body.data.ok.should.to.be.true;
                            res.body.data.should.have.property('group');
                            res.body.data.group.should.be.a('object');
                            res.body.data.group.should.have.property('id');
                            res.body.data.group.id.should.be.a('string');
                            res.body.data.group.id.should.eql(GROUP_TEST_ID);
                            res.body.data.group.should.have.property('name');
                            res.body.data.group.name.should.be.a('string');
                            res.body.data.group.name.should.eql(GROUP_TEST_NAME);

                            done();
                        });
                });
                it('users.info (no user)', (done) => {
                    chai.request(endpoint)
                        .post('/api/function')
                        .set(defaultHeaders)
                        .send({
                            function: '__request',
                            params: {
                                path: 'users.info'
                            }
                        })
                        .end((err, res) => {
                            //console.log('RES BODY <<<< '+JSON.stringify(res.body)+' >>>>');
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            // endpoint exception
                            res.body.should.have.property('date');
                            res.body.date.should.be.a('number');
                            res.body.should.have.property('data');
                            res.body.data.should.be.a('object');
                            res.body.data.should.have.property('__endpoint_exception__');
                            res.body.data.__endpoint_exception__.should.to.be.true;
                            res.body.data.should.have.property('message');
                            res.body.data.message.should.to.contain("user_not_found");

                            done();
                        });
                });
            });
        });
    });
};

// starting nock to replace Endpoints Services calls

nock(esApi)
    .post('/endpoints/logs')
    .times(500)
    .reply(200, function(uri, requestBody) {
        console.log('--------- ES --------- APP LOG: '+JSON.stringify(requestBody));
        return {processed: true};
    });

nock(esApi)
    .post('/endpoints/events')
    .times(500)
    .reply(200, (uri, requestBody) =>  {
        let json = JSON.parse(JSON.stringify(requestBody));

        console.log('--------- ES --------- EVENTS: '+JSON.stringify(json));
        json.should.have.property('date');
        json.date.should.be.a('number');
        json.should.have.property('event');
        json.event.should.be.a('string');
        json.should.have.property('data');
        json.data.should.be.a('object');
        json.data.should.have.property('type');
        json.data.type.should.be.a('string');

        if(json.data.type == 'hello'){
            setTimeout(() => executeTests(), 500);
        }

        return {processed: true};
    });

const waitingFrom = new Date();
const checkEvent = done => {
    setTimeout(() => {
        if(startingTests){
            done()
        } else {
            if((new Date()) - waitingFrom <= 30000) {
                checkEvent(done)
            } else {
                done(new Error('"hello" event did not arrived'))
            }
        }
    }, 500)
};

describe('Starting Slack endpoint...', () => {
    it('waiting for "hello" event', done => {
        checkEvent(done)
    });
});