/**
 * @author email:8427003@qq.com 百度hi：雷锋with红领巾
 * @file baidu fecs 代码检查插件;
 */

/* globals atom */

const fecs = require('fecs');
const Atom = require('atom');
const path = require('path');

let disposables = null;
let mainDisposables = null;
let editor = null;
let errorsMap = {};

let SEVERITY = {
    ERROR: 2,
    WARNING: 1
};

let decorConfig = {
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

/* eslint-disable fecs-valid-map-set */
let checkExtMap = {
    '.js': 1,
    '.html': 1,
    '.css': 1,
    '.less': 1,
    '.sass': 1
};
/* eslint-enable fecs-valid-map-set */


function addDecorators(errors) {

    errorsMap = {};

    for (let i = 0, size = errors.length; i < size; i++) {

        let item = errors[i];
        let {line, severity} = item;
        let marker = editor.markBufferRange([[line - 1, 1], [line - 1, 1]]);

        if (severity === SEVERITY.WARNING) {
            editor.decorateMarker(marker, decorConfig.lineWarning);
            editor.decorateMarker(marker, decorConfig.lineNumWarning);
        }
        else {
            editor.decorateMarker(marker, decorConfig.lineError);
            editor.decorateMarker(marker, decorConfig.lineNumError);
        }

        errorsMap[line] = item;

    }

}

function clearAllDecorators() {

    Object
        .keys(decorConfig)
        .forEach(key =>
            editor
                .getDecorations(decorConfig[key])
                .forEach(decorator => decorator.destroy())
        );

}

function check() {
    fecs.check(getOptions(), (success, errors = []) => {
        clearAllDecorators();
        if (errors && errors[0]) {
            addDecorators(errors[0].errors);
        }
        updateStatusBar();
    });
}

function getOptions() {
    return Object.assign(
        {},
        fecs.getOptions(),
        {
            /* eslint-disable */
            _: [
                getPath()
            ],
            /* eslint-enable */
            reporter: 'baidu'
        }
    );
}
function getPath() {
    return editor && editor.getPath();
}

let fecsStatusBar = (function () {

    let element = document.createElement('a');
    element.setAttribute('id', 'fecs-statusbar');
    return element;

})();

function updateStatusBar() {

    if (!editor) {
        return;
    }

    let line = editor.getCursorBufferPosition().row + 1;
    let item = errorsMap && errorsMap[line];
    let text = '';

    if (item) {

        let {
            line,
            column,
            rule,
            message
        } = item;

        text = `fecs: ${line}:${column} ${message} [${rule}]`;
    }

    fecsStatusBar.textContent = text;
    fecsStatusBar.setAttribute('title', text);
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
    disposables = new Atom.CompositeDisposable();
    disposables.add(editor.onDidSave(check));
    disposables.add(editor.onDidChangeCursorPosition(updateStatusBar));
    check();
}

module.exports = {
    activate() {
        mainDisposables = new Atom.CompositeDisposable();
        mainDisposables.add(atom.workspace.observeActivePaneItem(registerEvents));
    },
    consumeStatusBar(statusBar) {
        statusBar.addLeftTile({item: fecsStatusBar});
    },
    deactivate() {
        disposables && disposables.dispose();
        mainDisposables && mainDisposables.dispose();
        mainDisposables = disposables = editor = null;
    }

};
