App = {
    Init: function () {
        kendo.culture("ru");
    },
    NewGUID: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    SetActualGridHeight: function (Grid, advHeightOffset = 0) {
        workAreaHeight = $(window).height() - Grid.element.offset().top + advHeightOffset - 2;
        Grid.wrapper.height(workAreaHeight);
        Grid.resize();
    },
    notify$elem: null,
    showNotify: function (message, type = "info") {
        if (App.notify$elem === null) {
            App.notify$elem = "notify-area-" + this.NewGUID();
            $("body").append("<div id='" + App.notify$elem + "'></div>");
            App.notify$elem = "#" + App.notify$elem;
        }
        $(App.notify$elem).kendoNotification({
            width: "auto",
            allowHideAfter: 3000,
            position: {
                left: 10,
                top: 10
            }
        }).data("kendoNotification").show(message, type);
    }
}
var TaskList = function (options) {
    var _options = options;
    var self = this;

    var AddWnd = function (options) {
        var self = this;
        self.parent = options.parent;
        self.$AddWndTmpl = options.elemTmpl;
        self.uiid = App.NewGUID();

        self.showWnd = function () {
            self.AddWndTmpl = kendo.template(self.$AddWndTmpl.html());
            $("body").append("<div id='Wnd-" + self.uiid + "'></div>");
            self.$AddWndElem = $("#Wnd-" + self.uiid);
            self.AddWndWindow = self.$AddWndElem.kendoWindow({
                animation: {
                    open: false,
                    close: false
                },
                minHeight: 100,
                minWidth: 450,
                modal: true,
                resizable: false,
                title: "Добавление задачи",
                visible: false,
                actions: [
                    "Close"
                ],
                resize: function () {

                },
                activate: function () {
                    this.center();
                },
                refresh: function () {
                    this.center();
                },
                close: function () {
                    this.destroy();
                }
            }).data("kendoWindow");
            self.AddWndWindow.setOptions({ width: 450, height: "auto" });
            _unbind();
            _bind();
            self.AddWndWindow.center().open();
        }

        function _bind() {
            self.AddWndVM = kendo.observable({
                data: {
                    ID: App.NewGUID(),
                    Title: "",
                    Description: "",
                    Created: new Date(),
                    Finished: null,
                    IsCompleted: false
                },
                OnBtnCancel: function (e) {
                    e.preventDefault();
                    self.AddWndWindow.close();
                },
                OnBtnSave: function (e) {
                    e.preventDefault();
                    var row = this.data;
                    if (row.Title === "") {
                        App.showNotify("Не все обязательные поля заполнены.", "error");
                        return;
                    }
                    var dataSend = {
                        ID: row.ID,
                        Title: row.Title,
                        Description: row.Description || "",
                        Created: row.Created,
                        Finished: row.Finished,
                        IsCompleted: row.IsCompleted
                    };
                    $.ajax({
                        type: "post",
                        url: "/api/Task",
                        dataType: "json",
                        data: dataSend,
                        async: true,
                        beforeSend: function () {
                            kendo.ui.progress(self.$AddWndElem, true);
                        },
                        success: function (data) {
                            self.AddWndWindow.close();
                            self.parent.Grid.dataSource.read();
                        },
                        error: function (data) {
                            kendo.ui.progress(self.$AddWndElem, false);
                        },
                        complete: function () {
                            kendo.ui.progress(self.$AddWndElem, false);
                        }
                    });
                }
            });
            AddWndRenderTmpl()
            kendo.bind(self.$AddWndElem, self.AddWndVM);
        };

        function AddWndRenderTmpl() {
            self.$AddWndElem.html(self.AddWndTmpl(self.AddWndVM));
        };

        function _unbind() {
            kendo.unbind(self.$AddWndElem);
        };

        return self;
    }


    this.Activate = function () {
        self.$Container = _options.$elem;
        unbind();
        bind();
        render();
    }

    function bind() {
        self.ContainerVM = kendo.observable({
            OnBtnAddClick: function () {
                var wnd = new AddWnd({
                    parent: self,
                    elemTmpl: self.$Container.find("#wnd-add")
                });
                wnd.showWnd();
            }
        });
        kendo.bind(self.$Container, self.ContainerVM);
    }

    function unbind() {
        kendo.unbind(self.$Container)
    }

    function render() {
        self.Grid = self.$Container.find("#taskgrid").kendoGrid({
            sortable: {
                mode: "single"
            },
            dataBound: function (e) {
                $.each(self.$Container.find("#taskgrid").find("input[type='checkbox']"), function (k, v) {
                    $(v).click(function () {
                        if (!$(this).prop("disabled")) {
                            $(this).prop("disabled", "disabled");
                            $(this).parent().parent().find("span").css({ textDecoration: "line-through" });
                            var Row = self.Grid.dataItem($(this).parent().parent());
                            $.ajax({
                                type: "put",
                                url: "/api/Task/" + Row.ID,
                                dataType: "json",
                                async: true
                            });
                        }
                    }
                    )                    
                });
            },
            dataSource: new kendo.data.DataSource({
                transport: {
                    read: function (e) {
                        $.ajax(
                            {
                                type: "get",
                                url: "/api/Task",
                                dataType: "json",
                                async: true,
                                beforeSend: function () {
                                    kendo.ui.progress(self.$Container, true);
                                },
                                success: function (data) {
                                    e.success(data);
                                },
                                error: function (data) {
                                    kendo.ui.progress(self.$Container, false);
                                    e.success([]);
                                },
                                complete: function () {
                                    kendo.ui.progress(self.$Container, false);
                                }
                            }
                        );
                    }
                },
                schema: {
                    model: {
                        id: "ID",
                        fields: {
                            Title: { type: "string" },
                            Description: { type: "string" },
                            Created: { type: "date" },
                            Finished: { type: "date" },
                            IsCompleted: { type: "bool" }
                        }
                    }
                }
                ,pageSize: 30
            }),
            pageable: {
                refresh: true,
                pageSizes: [25, 30, 50, 75, 100],
                buttonCount: 5
            },
            scrollable: true,
            resizable: false,
            selectable: false,
            columns: [
                {
                    field: "IsCompleted",
                    width: 30,
                    title: " ",
                    template: '<input type="checkbox" id="to-id-#:ID#" class="k-checkbox" #:IsCompleted?"disabled checked":""#><label class="k-checkbox-label" for="to-id-#:ID#"></label>',
                    headerAttributes: { style: "text-align: center; vertical-align:middle;" },
                    attributes: { style: "text-align: left; vertical-align:middle; -moz-hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; word-wrap: break-word;" }
                },
                {
                    field: "Title",
                    title: "Задача",
                    template: '<span #:IsCompleted?"style=text-decoration:line-through;":""#>#:Title#</span>',
                    headerAttributes: { style: "text-align: center; vertical-align:middle;" },
                    attributes: { style: "text-align: left; vertical-align:middle; -moz-hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; word-wrap: break-word;" }
                },
                {
                    field: "Description",
                    title: "Описание",
                    template: function (data) {
                        var result = data.Description;
                        if (result.length > 160) result = result.substring(0, 157) + "...";
                        return "<span " + (data.IsCompleted ? "style='text-decoration:line-through;'" : "") + ">" + result + "</span>";
                    },
                    headerAttributes: { style: "text-align: center; vertical-align:middle;" },
                    attributes: { style: "text-align: left; vertical-align:middle; -moz-hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; word-wrap: break-word;" }
                },
                {
                    field: "Created",
                    title: "Создана",
                    template: function (data) {
                        var result = kendo.toString(kendo.parseDate(data.Created), "g");
                        return "<span " + (data.IsCompleted ? "style='text-decoration:line-through;'" : "") + ">" + result + "</span>";
                    },
                    headerAttributes: { style: "text-align: center; vertical-align:middle;" },
                    attributes: { style: "text-align: left; vertical-align:middle; -moz-hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; word-wrap: break-word;" }
                }
            ],
            change: function (e) {
                e.preventDefault();
                var selectedRows = this.select();

            },
            noRecords: true,
            messages: {
                noRecords: "Задач нет."
            }
        }).data("kendoGrid");

        App.SetActualGridHeight(self.Grid, -120);

        $(window).on("resize", function () {
            App.SetActualGridHeight(self.Grid, -120);
        });

    }

    return this;
}