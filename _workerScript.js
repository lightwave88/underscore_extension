////////////////////////////////////////////////////////////////////////////////
//
// _.worker() 本體
//
////////////////////////////////////////////////////////////////////////////////
console.log('i am worker');
let $_;

self.addEventListener('message', function (e) {
    // debugger;

    console.log('---------------');
    console.log('worker> get web message');

    let data = e.data || {};
    //----------------------------            
    let scriptPath = data['scriptPath'] || null;
    let extensionPath = data["extensionPath"] || null;
    let command = data['command'] || '';
    let args = data.args || [];
    let id = data.id || 0;
    //----------------------------
    // load _.script
    if ($_ == null) {
        // worker 需要初始化
        console.log('worker(%s)> init', id);

        if (scriptPath) {
            console.log('worker(%s)> import script', id);
            // 初始化
            importScripts(scriptPath);
            importScripts(extensionPath);
            $_ = self._;
        } else {
            console.log('worker(%s)> no scriptPath', id);
        }

        self.postMessage({});

    } else {
        // worker 接運算任務
        // debugger;

        console.log('worker(%s)> do job', id);

        if (!command && typeof $_[command] !== 'function') {
            throw new TypeError('no assign fun');
        }
        // debugger;
        // _ 的運算
        let res = $_[command].apply($_, args);
        //----------------------------        
        self.postMessage({
            res: res
        });
    }

    console.log('---------------');
});