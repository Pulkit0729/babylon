var engine = null;
var scene = null;
var selectedObject = null;
var defaulMaterial = null;
var depthRenderer = null;
var edgeMaterial = null;

initFunction = async function () {
    var canvas = document.getElementById("renderCanvas");
    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine(canvas);
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine(canvas);
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    engine.resize();
    window.scene = createScene();
};

const createScene = function () {
    scene = new BABYLON.Scene(engine);
    scene.createDefaultCameraOrLight(true, true, true);
    depthRenderer = scene.enableDepthRenderer();
    depthTexture = depthRenderer.getDepthMap();

    edgeMaterial = createEdgeMaterial();
    edgeMaterial.setTexture("depthSampler", depthTexture);

    var sceneCamera = scene.activeCamera;
    sceneCamera.setTarget(BABYLON.Vector3.Zero());
    sceneCamera.position = new BABYLON.Vector3(0, 5, -10);

    defaulMaterial = new BABYLON.StandardMaterial("defaulMaterial", scene);
    defaulMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);

    addObjects(scene);
    importObj(scene);
    addRaycast(scene, edgeMaterial);
    addGui();
    return scene;
};

function createEdgeMaterial() {
    var material = new BABYLON.ShaderMaterial("edgeShader", scene, "./edgeShader", {
        attributes: ["position"],
        uniforms: ["depthSampler", "worldViewProjection", "textureSize", "edgeColor", "edgeThickness"],
    });
    material.setVector4('edgeColor', new BABYLON.Vector4(1, 1, 1, 1));
    material.setFloat('edgeThickness', 2.0);
    return material;
}

function addObjects(scene) {
    if (!defaulMaterial) return;
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    ground.material = defaulMaterial;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1;
    sphere.material = defaulMaterial;

    var sphere1 = BABYLON.MeshBuilder.CreateSphere("sphere1", { diameter: 2, segments: 32 }, scene);
    sphere1.position = new BABYLON.Vector3(-2, 4, 0);
    sphere1.material = defaulMaterial;

    var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", { diameter: 2, segments: 32 }, scene);
    sphere2.position = new BABYLON.Vector3(1, 3, -1);
    sphere2.material = defaulMaterial;

}

function addRaycast(scene, edgeMaterial) {
    scene.onPointerMove = function castRay() {
        const hit = scene.pick(scene.pointerX, scene.pointerY);
        if (hit.pickedMesh) {
            if (!selectedObject) {
                selectedObject = hit.pickedMesh;
            } else {
                if (selectedObject.name != hit.pickedMesh.name) {
                    selectedObject.material = defaulMaterial;
                    selectedObject = hit.pickedMesh;
                }
            }
            edgeMaterial.setVector2("textureSize", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
            refreshDepthMap();
            hit.pickedMesh.material = edgeMaterial;
        }
        else if (selectedObject) {
            selectedObject.material = defaulMaterial;
            selectedObject = null;
        }
        return null;
    }
}

function importObj(scene) {
    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    BABYLON.SceneLoader.ImportMesh(
        '',
        '/',
        'model.obj',
        scene,
        (results) => {
            model = results[0];
            model.material = defaulMaterial;
            model.name = 'Tree';
            model.rotation = new BABYLON.Vector3(-Math.PI / 2, 0, 0);
            model.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
        }
    );
}

function addGui() {
    var gui = new dat.GUI();
    gui.domElement.id = "datGUI";
    var folder = gui.addFolder('Edge Material');
    folder.addColor({
        color: 0xffffff
    }, "color").onChange(function (value) {
        var rgb = {
            r: (Math.floor(value / (256 * 256))) / 255,
            g: (Math.floor(value / 256) % 256) / 255,
            b: (value % 256) / 255
        }
        edgeMaterial.setVector4('edgeColor', new BABYLON.Vector4(rgb.r, rgb.g, rgb.b, 1));
    });
    folder.add({ thichness: 2 }, "thichness", 0.1, 10).onChange(function (value) {
        edgeMaterial.setFloat('edgeThickness', value);
    });

}

function refreshDepthMap() {
    scene.meshes.forEach(mesh => {
        if (selectedObject && mesh.name == selectedObject.name) {
        } else {
            mesh.isVisible = false;
        }
    });

    depthRenderer.enabled = true;
    scene.render();
    depthRenderer.enabled = false;
    scene.meshes.forEach(mesh => {
        mesh.isVisible = true;
    });
}

const createDefaultEngine = function (canvas) {
    return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
};

// Resize
window.addEventListener("resize", function () {
    engine.resize();
    edgeMaterial.setVector2("textureSize", new BABYLON.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
});

const startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });
}
window.onload = initFunction;
