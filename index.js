/**
 * @author email:8427003@qq.com 百度hi：雷锋with红领巾
 * @file baidu fecs 代码检查插件;
 */

var fecs = require('fecs');
var Atom = require('atom');
var path = require('path');

var statusBar = null;
var disposables = null;
var mainDisposables = null;
var editor = null;
var errorLineSet = null;

var lineDecorConfig = {
    'type': 'line',
    'class': 'fecs-line'
};
var lineNumDecorConfig = {
    'type': 'line-number',
    'class': 'fecs-line-number'
};
var checkExtMap = {
    '.js': true,
    '.html': true,
    '.css': true,
    '.less': true,
    '.sass': true
};

function checkHandler(success, error) {
    error = error || [];
    error.length === 0 && error.push({});
    var errors = error[0].errors || [];
    var marker = null;
    errorLineSet = {};
    clearOldMarks();

    for (var i = 0, item = null, size = errors.length; i < size; i++) {
        item = errors[i];
        marker = editor.markBufferRange([[item.line - 1, 1], [item.line - 1, 1]]);
        editor.decorateMarker(marker, lineDecorConfig);
        editor.decorateMarker(marker, lineNumDecorConfig);
        errorLineSet[item.line] = item;
    }
    updateStatusBar();
}
function clearOldMarks() {
    var lineDecors = editor.getDecorations(lineDecorConfig);
    for (var i = 0; i < lineDecors.length; i++) {
        lineDecors[i].destroy();
    }

    var lineNumDecors = editor.getDecorations(lineNumDecorConfig);
    for (var j = 0; j < lineNumDecors.length; j++) {
        lineNumDecors[j].destroy();
    }
}

function onSaveHandler() {
    var options = getOptions();
    fecs.check(options, checkHandler);
}
function onChangeCursorPositionHandler() {
    updateStatusBar();
}

function getOptions() {
    var options = fecs.getOptions() || {};
    options._ = [];
    options._.push(getPath());

    return options;
}
function getPath() {
    return editor && editor.getPath();
}

var fecsStatusBar = document.createElement('a');
fecsStatusBar.setAttribute('id', 'fecs-statusbar');

function updateStatusBar() {
    var line = editor.getCursorBufferPosition().row + 1;

    var item = errorLineSet  && errorLineSet[line];

    var text = '';
    if (item) {
        text = 'fecs: ' + item.line + ':' + item.column + ' ' + item.message;
    }
    fecsStatusBar.textContent = text;
    fecsStatusBar.setAttribute('title', text);
}
function registerEvents(){
    editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
        return;
    }

    var filePath = getPath();
    console.log('curCheckFile' + filePath);
    if (!filePath) {
        return;
    }
    var ext = path.extname(filePath);

    if (!checkExtMap[ext]) {
        return;
    }
    disposables && disposables.dispose();
    disposables = new Atom.CompositeDisposable();
    disposables.add(editor.onDidSave(onSaveHandler));
    disposables.add(editor.onDidChangeCursorPosition(onChangeCursorPositionHandler));
    onSaveHandler();
}
module.exports = {
    activate: function () {
        mainDisposables = new Atom.CompositeDisposable();
        mainDisposables.add(atom.workspace.observeActivePaneItem(registerEvents));
    },
    consumeStatusBar: function (_statusBar) {
        statusBar = _statusBar;
        statusBar.addLeftTile({item: fecsStatusBar});
    },
    deactivate: function () {
        disposables && disposables.dispose();
        mainDisposables && mainDisposables.dispose();
        editor = null;
    }

};
