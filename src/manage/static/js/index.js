$(function() {
    var $projectList = $('#project-list');
    var pacText;

    $(document)
        .on('click', '.project-fold-toggle ', function(e) {
            $(e.target).closest('.project-item').toggleClass('folded');
        })
        .on('click', '.tab-anchor', function(e) {
            var $item = $(e.target);
            $item.siblings().removeClass('active');
            $item.addClass('active');
            var $p = $item.parent().parent();
            var $tab = $p.find('.tab[data-tab=' + $item.data('tab') + ']');
            $tab.siblings().removeClass('active');
            $tab.addClass('active');
        })
        .on('click', '.add-project', function() {
            $projectList.append(Tmpl.index_project({
                isNew: true
            }));
        })
        .on('click', '.delete-project', function(e) {
            $(e.target).closest('.project-item').remove();
            save();
        })
        .on('click', '.add-rule', function(e) {
            var $table = $(e.target).closest('.rule-table');
            $table.append(Tmpl.index_rule_row());
        })
        .on('click', '.add-host', function(e) {
            var $table = $(e.target).closest('.host-table');
            $table.append(Tmpl.index_host_row());
        })
        .on('click', '.add-advance', function(e) {
            var $table = $(e.target).closest('.advance-table');
            $table.append(Tmpl.index_advance_row());
        })
        .on('click', '.delete-row', function(e) {
            $(e.target).closest('tr').remove();
            save();
        })
        .on('click', '.save-setting', function() {
            save();
        })
        .keydown(function(e) {
            if (e.ctrlKey && e.keyCode === 13) {
                save();
            }
        })
        .on('click', 'input[type=checkbox]', function() {
            save();
        });

    $('#proxy-type').change(function() {
        var type = $(this).val();
        if (type === 'pac') {
            $('.proxy-pac').show();
        } else {
            pacText = '';
            $('#proxy-pac-val').val('');
            $('.proxy-pac').hide();
        }
    });
    $('#proxy-pac-file').change(function() {
        var file = $('#proxy-pac-file')[0].files[0];
        if (file) {
            var fr = new FileReader();
            fr.onload = function() {
                if (fr.result) {
                    var text = fr.result.replace(/^[^,]*,/,'');
                    pacText = text;
                    $('#proxy-pac-val').val(text);
                }
            }
            fr.readAsDataURL(file);
        }
    });
    
    function save() {
        var projects = $.map($('.project-item'), function(p) {
            var $p = $(p);
            var project = {
                name: $p.find('.project-name').val(),
                enable: $p.find('.project-enable')[0].checked
            };
            project.rule = $.map($p.find('.rule-item'), function(item) {
                var $item = $(item);
                return {
                    enable: $item.find('.enable')[0].checked,
                    match: $item.find('.match').val(),
                    target: $item.find('.target').val()
                };
            });
            project.host = $.map($p.find('.host-item'), function(item) {
                var $item = $(item);
                return {
                    enable: $item.find('.enable')[0].checked,
                    ip: $item.find('.ip').val(),
                    host: $item.find('.host').val()
                };
            });
            project.advance = $.map($p.find('.advance-item'), function(item) {
                var $item = $(item);
                return {
                    enable: $item.find('.enable')[0].checked,
                    match: $item.find('.match').val(),
                    ip: $item.find('.ip').val(),
                    target: $item.find('.target').val()
                };
            });
            
            return project;
        });
        var settings = {
            projects: projects,
            proxyType: $('#proxy-type').val(),
            proxyEnable: $('#proxy-enable')[0].checked
        };
        switch (settings.proxyType) {
            case 'pac':
                settings.proxyPac = pacText;
                break;
            default: 
                break;
        }
        $.ajax('save', {
            type: 'post',
            data: {
                data: JSON.stringify(settings)
            },
            dataType: 'json',
            success: function(data) {
                $('.save-hint').text('success');
                setTimeout(function() {
                    $('.save-hint').text('');
                }, 3000);
            },
            error: function() {
                $('.save-hint').text('save fail');
            }
        });
    }

    $projectList.append($.map($$.settings.projects, function(project) {
        var $p = $(Tmpl.index_project(project));
        $p.find('.rule-table').append($.map(project.rule, function(item) {
            return Tmpl.index_rule_row(item);
        }).join(''));
        $p.find('.host-table').append($.map(project.host, function(item) {
            return Tmpl.index_host_row(item);
        }).join(''));
        $p.find('.advance-table').append($.map(project.advance, function(item) {
            return Tmpl.index_advance_row(item);
        }).join(''));
        return $p;
    }));

    $('#proxy-type').val($$.settings.proxyType).trigger('change');
    $('#proxy-pac-val').val($$.settings.proxyPac);
    $('#proxy-enable')[0].checked = $$.settings.proxyEnable;
    pacText = $$.settings.proxyPac || '';
});
