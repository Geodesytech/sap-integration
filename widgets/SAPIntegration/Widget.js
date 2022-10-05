define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/html",
  "dojo/_base/array",
  "jimu/LayerInfos/LayerInfos",
  "dojo/on",
  "jimu/BaseWidget",
  "esri/layers/FeatureLayer",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/Color",
  "esri/graphic",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "dojo/parser",
  "dojo/dom",
  "dijit/registry",
  "dijit/ConfirmDialog",
  "dijit/form/Button",
  "dijit/form/TextBox",
  "dijit/form/Select",
  "dojo/data/ObjectStore",
  "dojo/store/Memory",
  "dijit/Fieldset",
  "dojo/dom-style",
  "dojo/domReady!",
], function (
  declare,
  lang,
  html,
  array,
  LayerInfos,
  on,
  BaseWidget,
  FeatureLayer,
  SimpleFillSymbol,
  SimpleLineSymbol,
  Color,
  Graphic,
  Query,
  QueryTask,
  parser,
  dom,
  registry,
  ConfirmDialog,
  Button,
  TextBox,
  Select,
  ObjectStore,
  Memory,
  Fieldset,
  domStyle
) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-sap",

    cityService:
      "http://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0",
    usaMap:
      "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/3",
    usaMa:
      "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3",
    tehsilMap:
      "https://services6.arcgis.com/47C7YqOiFYQ4nST3/ArcGIS/rest/services/tehsil_info/FeatureServer/0",
    parsaMap:
      "https://services6.arcgis.com/47C7YqOiFYQ4nST3/arcgis/rest/services/parsa_land_info/FeatureServer/0",
    highlightGraphic: {},

    componentsList: ["private-com", "private", "forest-com", "forest", "govt"],
    updateFeature: null,
    parcelLayer: null,
    confirmPopup: null,
    privateFields: [
      "pay_cost_unit",
      "pay_cost_plot",
      "pay_cost_lieu",
      "grant_dis_fam",
      "grant_scst_fam",
      "tran_cost_fam",
      "pay_cattle_sh",
      "grant_art_trader",
      "settle_allow",
      "fee_stamp_duty",
    ],
    forestFields: [
      "pay_npv",
      "pay_safety_zn",
      "amt_wlmp",
      "amt_ca_scheme",
      "pay_gap_smc",
      "pay_tree_fel",
    ],
    govFields: [
      "pay_premium",
      "pay_lease_rent_an",
      "pay_assets",
      "pay_ench_gov_lnd",
      "pay_ench_forest_lnd",
    ],
    landType: null,
    wbsList: [
      { id: "P1", label: "P-1000-01" },
      { id: "P2", label: "P-1000-02" },
      { id: "P3", label: "P-1000-03" },
      { id: "P4", label: "P-1000-04" },
      { id: "P5", label: "P-1000-05" },
      { id: "P6", label: "P-1000-06" },
      { id: "P7", label: "P-1000-07" },
      { id: "P8", label: "P-1000-08" },
      { id: "P9", label: "P-1000-09" },
      { id: "P10", label: "P-1000-10" },
      { id: "P11", label: "P-1000-11" },
      { id: "P12", label: "P-1000-12" },
    ],
    payTypeList: [
      { id: "PYF1", label: "Full Payment" },
      { id: "PYP1", label: "Partial Payment" },
    ],
    startup: function () {
      this.inherited(arguments);
      parser.parse();
      this._confirmPopup();
      this._updateAttributes();
      // this.map.on("click", function (event) {});

      this.parcelLayer = this.map.getLayer(
        this._getLayerID(this.map, "parsa_land_info")
      );
      // this._getLayerID(this.map, "parsa_land_info");
      console.log(this.parcelLayer);
      var highlightSymbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([255, 0, 0]),
          3
        ),
        new Color([125, 125, 125, 0.35])
      );
      this.parcelLayer.on(
        "click",
        lang.hitch(this, function (evt) {
          console.log(evt.graphic.attributes.land_b);
          this.landType = evt.graphic.attributes.land_b;
          this._displayComponents(
            evt.graphic.attributes.land_b,
            evt.graphic.attributes.tree_com
          );
          if (this.highlightGraphic) this.map.graphics.clear();
          this.highlightGraphic = new Graphic(
            evt.graphic.geometry,
            highlightSymbol
          );
          this.map.graphics.add(this.highlightGraphic);
          this.updateFeature = evt.graphic;

          // this.updateFeature.attributes["project_id"] = "GIRISH";
          // this.updateFeature
          //   .getLayer()
          //   .applyEdits(null, [this.updateFeature], null);
        })
      );
    },
    lstTpe: function () {
      var t = {
        GOVT: this.govFields,
        FOREST: this.forestFields,
        PRIVATE: this.privateFields,
      };
      return t[this.landType];
    },
    _displayComponents: function (componentId, tree_com) {
      // dom.byId("master-panel").style.display = "inline-block";
      // domStyle.set(registry.byId("payment-type"), {
      //   display: "inline-block",
      // });
      // dom.byId("payment-type").style.display = "inline-block";
      dom.byId("init-pay-container").style.display = "none";
      dom.byId("pay-container").style.display = "inline-block";
      document.getElementById("init-forest").style.display = "none";
      document.getElementById("init-private").style.display = "none";
      this.componentsList.map((lst, i) => {
        document.getElementById(lst).style.display = "none";
        if (lst.split("-")[0] === componentId.toLowerCase()) {
          document.getElementById(lst).style.display = "inline-block";
          if (tree_com === null && componentId !== "GOVT") {
            document.getElementById(
              "init-" + componentId.toLowerCase()
            ).style.display = "inline-block";
          }
        }
      });
    },
    _getLayerID: function (map, layerTitle) {
      //local function to fetch the LayerID of layer in the map
      var layerID;
      LayerInfos.getInstance(map, map.itemInfo).then(
        lang.hitch(function (operLayerInfos) {
          operLayerInfos.traversal(function (layerInfo) {
            if (layerInfo.title == layerTitle) {
              debugger;
              console.log(layerInfo);
              layerID = layerInfo.id;
            }
          });
        })
      );
      return layerID;
    },
    _addFeatureLayer: function () {
      // var featureLayer = new FeatureLayer(this.cityService);
      var featureLayer = new FeatureLayer(this.parsaMap, {
        mode: FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
      });
      // this.map.addLayer(featureLayer);

      featureLayer.on("click", function (e) {
        debugger;
        console.log(e);
        // var specific = e.graphic.attributes["SpecificAttribute"];
        // window.open("http://YourUrl.com/" + specific);
      });
    },
    _confirmPopup: function () {
      this.confirmPopup = new ConfirmDialog({
        title: "Raise Payment",
        content: "Do you want to continue?",
        style: "width: 300px",
      });
      this.confirmPopup.set("buttonOk", "Yes");
      this.confirmPopup.set("buttonCancel", "No");
      this._setWBSUI();
      // var wbsStore = new Memory({ data: this.wbsList });

      // var wbsObjStore = new ObjectStore({ objectStore: wbsStore });

      // var pvt_land = new Select(
      //   { store: wbsObjStore },
      //   "pvt-land-wbs"
      // ).startup();
      // var pvt_asset = new Select(
      //   { store: wbsObjStore },
      //   "pvt-asset-wbs"
      // ).startup();
      // var pvt_tree = new Select(
      //   { store: wbsObjStore },
      //   "pvt-tree-wbs"
      // ).startup();

      // var frt_land = new Select(
      //   { store: wbsObjStore },
      //   "forest-land-wbs"
      // ).startup();
      // var frt_asset = new Select(
      //   { store: wbsObjStore },
      //   "forest-asset-wbs"
      // ).startup();
      // var frt_tree = new Select(
      //   { store: wbsObjStore },
      //   "forest-tree-wbs"
      // ).startup();

      // s1.on("change", function () {
      //   console.log("my value: ", this.get("value"));
      // });
      // "pvt-land-wbs",
      // "pvt-asset-wbs",
      // "pvt-tree-wbs",
      // "forest-land-wbs",
      // "forest-asset-wbs",
      // "forest-tree-wbs",
    },
    _setWBSUI: function () {
      var payTypeStore = new Memory({ data: this.payTypeList });

      var paymetTypeObjStore = new ObjectStore({ objectStore: payTypeStore });
      var paymentType = new Select(
        { store: paymetTypeObjStore },
        "payment-type"
      ).startup();

      var wbsStore = new Memory({ data: this.wbsList });

      var wbsObjStore = new ObjectStore({ objectStore: wbsStore });

      var wbsIdLst = [
        "init-pvt-land-wbs",
        "init-pvt-asset-wbs",
        "init-pvt-tree-wbs",
        "init-forest-land-wbs",
        "init-forest-asset-wbs",
        "init-forest-tree-wbs",
      ];
      for (let index = 0; index < wbsIdLst.length; index++) {
        const element = wbsIdLst[index];
        new Select({ store: wbsObjStore }, element).startup();
      }
      this.calculatePrivateTotal();
      this.calculateForestTotal();
    },

    calculatePrivateTotal: function () {
      console.log("Calculate");
      var landCom = registry.byId("init-pvt-land-com");
      var assetCom = registry.byId("init-pvt-asset-com");
      var treeCom = registry.byId("init-pvt-tree-com");
      var totalCom = registry.byId("init-pvt-total-com");

      landCom.on(
        "change",
        lang.hitch(this, function () {
          var total =
            parseFloat(landCom.value ? landCom.value : 0) +
            parseFloat(assetCom.value ? assetCom.value : 0) +
            parseFloat(treeCom.value ? treeCom.value : 0);
          totalCom.setValue(total);
        })
      );
      assetCom.on(
        "change",
        lang.hitch(this, function () {
          var total =
            parseFloat(landCom.value ? landCom.value : 0) +
            parseFloat(assetCom.value ? assetCom.value : 0) +
            parseFloat(treeCom.value ? treeCom.value : 0);
          totalCom.setValue(total);
        })
      );
      treeCom.on(
        "change",
        lang.hitch(this, function () {
          var total =
            parseFloat(landCom.value ? landCom.value : 0) +
            parseFloat(assetCom.value ? assetCom.value : 0) +
            parseFloat(treeCom.value ? treeCom.value : 0);
          totalCom.setValue(total);
        })
      );
      // return total;
    },
    calculateForestTotal: function () {
      console.log("Private Calculate");
      var landCom = registry.byId("init-fra-land-com");
      var assetCom = registry.byId("init-fra-asset-com");
      var treeCom = registry.byId("init-fra-tree-com");
      var totalCom = registry.byId("init-fra-total-com");

      landCom.on(
        "change",
        lang.hitch(this, function () {
          var total =
            parseFloat(landCom.value ? landCom.value : 0) +
            parseFloat(assetCom.value ? assetCom.value : 0) +
            parseFloat(treeCom.value ? treeCom.value : 0);
          totalCom.setValue(total);
        })
      );
      assetCom.on(
        "change",
        lang.hitch(this, function () {
          var total =
            parseFloat(landCom.value ? landCom.value : 0) +
            parseFloat(assetCom.value ? assetCom.value : 0) +
            parseFloat(treeCom.value ? treeCom.value : 0);
          totalCom.setValue(total);
        })
      );
      treeCom.on(
        "change",
        lang.hitch(this, function () {
          var total =
            parseFloat(landCom.value ? landCom.value : 0) +
            parseFloat(assetCom.value ? assetCom.value : 0) +
            parseFloat(treeCom.value ? treeCom.value : 0);
          totalCom.setValue(total);
        })
      );
      // return total;
    },
    _updateAttributes: function () {
      var updateButton = dom.byId("updateButton");
      // show
      on(
        updateButton,
        "click",
        lang.hitch(this, function () {
          this.confirmPopup.show();
          console.log("alertUser", "I am alerting you.");
          // console.log(this.updateFeature);
        })
      );
      // register events
      this.confirmPopup.on(
        "execute",
        lang.hitch(this, function () {
          console.log(this.lstTpe());
          var featureAttributes = this.lstTpe().map((gov, i) => ({
            [gov]: dom.byId(gov).value,
          }));
          console.log(featureAttributes);
          // this.updateFeature.attributes["project_id"] = "PARSA74";
          // this.updateFeature
          //   .getLayer()
          //   .applyEdits(null, [this.updateFeature], null);
        })
      );
      this.confirmPopup.on("cancel", function () {
        alert("Bye");
      });

      // var myBtn = registry
      //   .byId("toggleButton")
      //   .connect("onClick", function (e) {
      //     console.log("clicked!");
      //   });
      // on(myBtn, "click", function (e) {
      //   console.log("clicked!");
      // });
      // var toggled = false;
      // registry.byId("toggleButton").connect("onClick", function toggle() {
      //   debugger;
      //   this.set(
      //     "iconClass",
      //     toggled
      //       ? "dijitEditorIcon dijitEditorIconCut"
      //       : "dijitEditorIcon dijitEditorIconPaste"
      //   );
      //   toggled = !toggled;
      // });
    },
    _createFilterNodes: function (filters) {
      array.forEach(
        filters,
        function (f) {
          this._createFilterNode(f);
        },
        this
      );
    },

    _createFilterNode: function (filter) {
      var node = html.create(
        "div",
        {
          class: "filter",
          style: {
            cursor: "pointer",
          },
          innerHTML: "City name start with:" + filter,
        },
        this.filterListNode
      );

      this.own(
        on(node, "click", lang.hitch(this, this._onFilterClick, filter))
      );
    },

    _onFilterClick: function (filter, evt) {
      var queryTask = new QueryTask(this.cityService);
      var query = new Query();
      query.where = "lower (CITY_NAME) like lower('" + filter + "%')";
      query.returnGeometry = true;
      query.outFields = ["*"];
      queryTask.execute(query, lang.hitch(this, this._onFilterReturn, filter));

      html.setStyle(evt.target, {
        backgroundColor: "yellow",
      });
    },

    _onFilterReturn: function (filter, featureSet) {
      this.updateDataSourceData("filter-" + filter, {
        features: featureSet.features,
      });
    },
  });
});
