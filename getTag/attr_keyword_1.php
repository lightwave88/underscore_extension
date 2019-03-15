<!DOCTYPE html>
<!--
To change this license header, choose License Headers in Project Properties.
To change this template file, choose Tools | Templates
and open the template in the editor.
-->
<?php
$strs = 'a8~`!@#$%^&*()-_=+\\{}[]"\':;?<,. />';
$data = str_split($strs, 1);
?>
<html>
    <head>
        <meta charset="UTF-8">
        <title></title>
        <style>
            div.box{
                display: inline-block;
                width: 100px;
                border: 1px dotted #aaa;
            }
        </style>
        <script>
            let i;
            let dom;
            let attrList;
        </script>
    </head>
    <body>
        <div>
            <p>檢測個符號與 attr 的關係</p>
            <p>
                <?php
                var_dump($data);
                ?>
            </p>
        </div>
        <div>
            <?php
            $i = 0;
            foreach ($data as $v) {
                ?>
                <div class="box">
                    <?php
                    printf('<p id="d_%d" %s="<xyz>" kk>%s</p>', $i,$v, $v);
                    ?>
                    <script>
                        i = <?php echo($i); ?>;
                        debugger;
                        dom = document.querySelector(`#d_${i}`);
                        attrList = dom.attributes;
                        attrList = Array.from(attrList);
                        {
                            let res = [];
                            attrList.forEach(function (v) {
                                // debugger;
                                let _v = v.value.replace(/<|>/g, '');
                                let _t = `${v.name} = ${_v}`;
                                res.push(_t);
                            });
                            document.write(res.join(',') + `-----(${dom.textContent})`);
                        }
                    </script>
                </div>
                <?php
                $i++;
            }
            ?>
        </div>

    </body>
</html>
