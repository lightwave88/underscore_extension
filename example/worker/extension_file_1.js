(function(_g){
    if(_g._ == null){
        return;
    }
    //----------------------------
    _.mixin({
        g1: g1
    });
    let uid = 0;

    function g1(data){
        try {
            data=    JSON.stringify(data);
        } catch (e) {
            data = 'error';
        }

         return `${uid++}=${data}`;
    }
})(this || {});
