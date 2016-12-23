'use babel';

/**
 * @author email:8427003@qq.com 百度hi：雷锋with红领巾
 * @file baidu fecs 代码检查插件;
 */

import fecs from 'fecs';
import path from 'path';
import {CompositeDisposable} from 'atom';

let statusBar = null;
let disposables = null;
let mainDisposables = null;
let editor = null;
let errorLineSet = null;

const SEVERITY = {
    ERROR: 2,
    WARNING: 1
};

const checkExtMap = {
    '.js': true,
    '.html': true,
    '.css': true,
    '.less': true,
    '.sass': true
};

const decorConfig = {
    lineWarning: {
        'type': 'line',
        'class': 'fecs-line-warning'
    },
    lineError: {
        'type': 'line',
        'class': 'fecs-line-error'
    },
    lineNumWarning: {
        'type': 'line-number',
        'class': 'fecs-line-number-warning'
    },
    lineNumError: {
        'type': 'line-number',
        'class': 'fecs-line-number-error'
    }
};

const fecsStatusBar = document.createElement('a');
fecsStatusBar.setAttribute('id', 'fecs-statusbar');

function getPath() {
    return editor && editor.getPath();
}

function getOptions() {
    let options = fecs.getOptions() || {};
    options.reporter = 'baidu';
    options._ = [];
    options._.push(getPath());

    return options;
}

function registerEvents() {
    editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
        return;
    }

    let filePath = getPath();
    if (!filePath) {
        return;
    }
    let ext = path.extname(filePath);
    if (!checkExtMap[ext]) {
        return;
    }
    disposables && disposables.dispose();
    disposables = new CompositeDisposable();
    disposables.add(editor.onDidSave(onSaveHandler));
    disposables.add(editor.onDidChangeCursorPosition(onChangeCursorPositionHandler));

    onSaveHandler();
}

function onSaveHandler() {
    let options = getOptions();
    fecs.check(options, checkHandler);
}

function checkHandler(success, error = []) {
    error.length === 0 && error.push({});
    let errors = error[0].errors || [];
    let marker = null;
    errorLineSet = {};
    clearOldMarks();
    for (let i = 0, item = null, size = errors.length; i < size; i++) {
        item = errors[i];
        marker = editor.markBufferRange([[item.line - 1, 1], [item.line - 1, 1]]);

        if (item.severity === SEVERITY.WARNING) {
            editor.decorateMarker(marker, decorConfig.lineWarning);
            editor.decorateMarker(marker, decorConfig.lineNumWarning);
        }
        else {
            editor.decorateMarker(marker, decorConfig.lineError);
            editor.decorateMarker(marker, decorConfig.lineNumError);
        }

        errorLineSet[item.line] = item;
    }
    updateStatusBar();
}

function clearOldMarks() {
    let decors = null;
    let keys = Object.keys(decorConfig);

    for (let i = 0; i < keys.length; i++) {
        decors = editor.getDecorations(decorConfig[keys[i]]);
        for (let j = 0; j < decors.length; j++) {
            decors[j].destroy();
        }
    }
}

function onChangeCursorPositionHandler() {
    updateStatusBar();
}

function updateStatusBar() {
    if (!editor) {
        return;
    }
    let line = editor.getCursorBufferPosition().row + 1;
    let item = errorLineSet && errorLineSet[line];

    let text = '';
    if (item) {
        text = 'fecs: ' + item.line + ':' + item.column + item.message + ' [' + item.rule + ']';
    }
    fecsStatusBar.textContent = text;
    fecsStatusBar.setAttribute('title', text);
}

export default {
    activate() {
        mainDisposables = new CompositeDisposable();
        mainDisposables.add(atom.workspace.observeActivePaneItem(registerEvents));
    },
    consumeStatusBar($statusBar) {
        statusBar = $statusBar;
        statusBar.addLeftTile({item: fecsStatusBar});
    },
    deactivate() {
        disposables && disposables.dispose();
        mainDisposables && mainDisposables.dispose();
        editor = null;
    }
};
