/**
 * Copyright (c) TUT Tampere University of Technology 2015-2016
 * All rights reserved.
 *
 * Main author(s):
 * Antti Nieminen <antti.h.nieminen@tut.fi>
 */

/**
 * API for managing projects of the IDE.
 *
 * The project metadata is stored in MongoDB (see project.model.js)
 * and the project files are store on the disk (see projectfile.controller.js).
 */

'use strict';

var _ = require('lodash');
var Project = require('./project.model');
var addProjectFiles = require('./projectfile.controller').addProjectFiles;
var errorHandler = require('../common').errorHandler;
var rimraf = require('rimraf');
var path = require('path');

var env = require('../../config/environment');
var GITDIR = env.git.projects;

// Get list of projects
exports.index = function(req, res) {
  Project.find().then(function(projects) {
    return res.status(200).json(projects);
  }).then(null, errorHandler(res));
};

// Get a single project
exports.show = function(req, res) {
  Project.findOne({name: req.params.project}).then(function(project) {
    if(!project) throw 404;
    return res.json(project);
  }).then(null, errorHandler(res));
};

exports.remove = function(req, res) {
  Project.findOneAndRemove({name: req.params.project})
    .then(function(project){
      //console.log(project.name);
      return removeProjectDir(project);
    })
    .then(function(data){
      //console.log(data);
      return res.sendStatus(202);
    })
    .then(null, errorHandler(res));
}

// Create a new project.
exports.create = function(req, res) {
  var data = req.body;
  if (!data.name || !data.name.match(/^[a-z][a-z0-9]*$/)) {
    return res.status(400).json({error: 'project name must match [a-z][a-z0-9]*'});
  }
  createProject(data).then(function(project) {
    return res.status(201).json(project);
  }).then(null, errorHandler(res));
};

function createProject(data) {
  var project;
  return Project.create(data).then(function(_project) {
    project = _project;
    return initProjectFiles(project);
  }).then(function() {
    return project;
  });
}
exports.createProject = createProject;

function removeProjectDir(project){
  var projectDir = path.resolve(GITDIR, project.name);
  return new Promise(function (resolve, reject) {
    rimraf(projectDir, function(err){
      if(err) {
        //console.log(err.toString());
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function initProjectFiles(project) {
  // The examplepackage dir contains a template project.
  // The files
  var files = [
    './examplepackage/agent.js',
    './examplepackage/main.js',
    './examplepackage/package.json',
    './examplepackage/liquidiot.json',
    './examplepackage/liquid-options.json',
  ];
  var vars = {
    project: project,
  };
  return addProjectFiles(files, project, vars);
}
