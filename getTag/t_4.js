let s = '5 ';

let i = 5;
let j = 0;
while(i--){
    let c = s.charAt(j);    
    console.log('--%s--(%s)', c, typeof(c));

    c = s[j];
    console.log('--%s--(%s)', c, typeof(c));

    j++;
}