import { useEffect, useMemo, useRef, useState } from "react";
import {
  LocateFixed,
  Minus,
  Pause,
  Play,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Film, Place } from "../data/films";
import { clusterPlaces, groupFilmsByPlace } from "../lib/places";
import type { PlaceCluster } from "../lib/places";

type Pin = PlaceCluster & { film: Film; vector: THREE.Vector3 };
type Props = {
  films: Film[];
  selected: Film | undefined;
  activePlace: string | undefined;
  onSelect: (film: Film, place?: Place) => void;
};
type ControlsAPI = {
  focus: (place: Place) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  spin: (value: boolean) => void;
};

export function latLngToVector(lat: number, lng: number, radius = 1) {
  const phi = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lng);
  return new THREE.Vector3(
    Math.cos(phi) * Math.cos(theta),
    Math.sin(phi),
    -Math.cos(phi) * Math.sin(theta),
  ).multiplyScalar(radius);
}

export default function Globe({
  films,
  selected,
  activePlace,
  onSelect,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const labels = useRef(new Map<string, HTMLButtonElement>());
  const controlsRef = useRef<ControlsAPI | null>(null);
  const dataRef = useRef<{
    pins: Pin[];
    selectedId?: string;
    activePlace?: string;
  }>({ pins: [] });
  const [error, setError] = useState("");
  const [rotating, setRotating] = useState(false);
  const [openPlace, setOpenPlace] = useState<string | null>(null);
  const [clusterRadius, setClusterRadius] = useState(8);
  const placePicker = useRef<HTMLDivElement>(null);
  const pins = useMemo(
    () =>
      clusterPlaces(
        groupFilmsByPlace(films),
        films.length > 60 ? clusterRadius : 0,
        activePlace,
      )
        .map((group) => ({
          ...group,
          vector: latLngToVector(group.place.lat, group.place.lng, 1.012),
          film:
            group.films.find((film) => film.id === selected?.id) ??
            group.films[0],
        }))
        .sort(
          (a, b) =>
            Number(b.film.id === selected?.id) -
            Number(a.film.id === selected?.id),
        ),
    [films, selected?.id, activePlace, clusterRadius],
  );
  const openPin = pins.find((pin) => pin.place.id === openPlace);
  dataRef.current = { pins, selectedId: selected?.id, activePlace };

  useEffect(() => {
    setOpenPlace(null);
  }, [films, selected?.id]);
  useEffect(() => {
    if (openPlace)
      placePicker.current
        ?.querySelector<HTMLButtonElement>(".place-picker-film")
        ?.focus();
  }, [openPlace]);
  const closePicker = () => {
    if (openPin)
      labels.current.get(openPin.film.id + ":" + openPin.place.id)?.focus();
    setOpenPlace(null);
  };

  useEffect(() => {
    const host = container.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(
        "이 환경에서는 3D 지구본을 표시할 수 없어요. 작품 목록으로 여행을 이어가세요.",
      );
      return;
    }
    let disposed = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.setAttribute(
      "aria-label",
      "영화 속 장소 지구본. 방향키로 회전하고 더하기, 빼기 키로 확대·축소할 수 있습니다.",
    );
    renderer.domElement.tabIndex = 0;
    host.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
    const startPosition = latLngToVector(30, 25, 3.55);
    camera.position.copy(startPosition);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 2.05;
    controls.maxDistance = 5.5;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.65;
    controls.autoRotateSpeed = 0.22;
    let currentRadius = 8;
    const adjustClustering = () => {
      const distance = camera.position.length();
      const nextRadius = distance > 3.1 ? 8 : distance > 2.5 ? 4 : 1.5;
      if (nextRadius !== currentRadius) {
        currentRadius = nextRadius;
        setClusterRadius(nextRadius);
      }
    };
    controls.addEventListener("change", adjustClustering);
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;

    const material = new THREE.MeshPhongMaterial({
      color: 0xd8e2d9,
      shininess: 4,
      specular: 0x223b48,
    });
    const geometry = new THREE.SphereGeometry(1, 96, 64);
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);
    let texture: THREE.Texture | undefined;
    new THREE.TextureLoader().load(
      "/earth.jpg",
      (loaded) => {
        if (disposed) {
          loaded.dispose();
          return;
        }
        texture = loaded;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = Math.min(
          renderer.capabilities.getMaxAnisotropy(),
          8,
        );
        material.map = loaded;
        material.needsUpdate = true;
      },
      undefined,
      () => {
        if (!disposed)
          setError(
            "지구 표면을 불러오지 못했어요. 장소 선택은 계속 사용할 수 있어요.",
          );
      },
    );
    // A softly lit atlas, without a fixed day/night side. The light rig follows
    // the viewer so every continent stays readable as the globe is explored.
    scene.add(new THREE.AmbientLight(0xd1dce5, 1.4));
    const light = new THREE.DirectionalLight(0xfff0dc, 2.2);
    light.position.set(-3, 4, 5);
    const fill = new THREE.DirectionalLight(0xc1ddf5, 1.1);
    fill.position.set(3, -1, 3);
    camera.add(light, fill, light.target, fill.target);
    light.target.position.set(0, 0, -3);
    fill.target.position.set(0, 0, -3);
    scene.add(camera);

    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x5681a2) } },
      vertexShader:
        "varying vec3 vNormal; varying vec3 vPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.0); vPosition=p.xyz; gl_Position=projectionMatrix*p; }",
      fragmentShader:
        "varying vec3 vNormal; varying vec3 vPosition; uniform vec3 glowColor; void main(){ float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),4.0); gl_FragColor=vec4(glowColor,rim*0.28); }",
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereGeometry = new THREE.SphereGeometry(1.035, 64, 48);
    scene.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xd8d9c3,
      transparent: true,
      opacity: 0.085,
    });
    const gridGeometries: THREE.BufferGeometry[] = [];
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const points = Array.from({ length: 181 }, (_, i) =>
        latLngToVector(latitude, i * 2 - 180, 1.002),
      );
      const grid = new THREE.BufferGeometry().setFromPoints(points);
      gridGeometries.push(grid);
      scene.add(new THREE.Line(grid, gridMaterial));
    }
    for (let longitude = 0; longitude < 360; longitude += 30) {
      const points = Array.from({ length: 91 }, (_, i) =>
        latLngToVector(i * 2 - 90, longitude, 1.002),
      );
      const grid = new THREE.BufferGeometry().setFromPoints(points);
      gridGeometries.push(grid);
      scene.add(new THREE.Line(grid, gridMaterial));
    }

    let destination: THREE.Vector3 | null = null;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    controlsRef.current = {
      focus(place) {
        controls.autoRotate = false;
        destination = latLngToVector(
          place.lat - 5,
          place.lng + 7,
          camera.position.length(),
        );
        if (reduceMotion) {
          camera.position.copy(destination);
          destination = null;
        }
      },
      zoom(factor) {
        destination = null;
        camera.position.setLength(
          THREE.MathUtils.clamp(
            camera.position.length() * factor,
            controls.minDistance,
            controls.maxDistance,
          ),
        );
      },
      reset() {
        destination = startPosition.clone();
        controls.autoRotate = false;
      },
      spin(value) {
        destination = null;
        controls.autoRotate = value;
      },
    };
    const stopSpin = () => {
      destination = null;
      controls.autoRotate = false;
      setRotating(false);
    };
    controls.addEventListener("start", stopSpin);

    const keydown = (event: KeyboardEvent) => {
      const amounts: Record<string, number> = {
        ArrowLeft: -0.12,
        ArrowRight: 0.12,
        ArrowUp: -0.12,
        ArrowDown: 0.12,
      };
      if (event.key in amounts) {
        event.preventDefault();
        stopSpin();
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        if (event.key === "ArrowLeft" || event.key === "ArrowRight")
          spherical.theta += amounts[event.key];
        else
          spherical.phi = THREE.MathUtils.clamp(
            spherical.phi + amounts[event.key],
            0.15,
            Math.PI - 0.15,
          );
        camera.position.setFromSpherical(spherical);
      }
      if (["+", "=", "-"].includes(event.key)) {
        event.preventDefault();
        controlsRef.current?.zoom(event.key === "-" ? 1.15 : 0.87);
      }
    };
    renderer.domElement.addEventListener("keydown", keydown);
    const lost = (event: Event) => {
      event.preventDefault();
      setError("3D 표시가 중단됐어요. 작품 목록은 계속 사용할 수 있습니다.");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    let metricsDirty = true;
    const resize = new ResizeObserver(() => {
      metricsDirty = true;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resize.observe(host);

    const pinPosition = new THREE.Vector3();
    const lastCamera = new THREE.Vector3(Infinity, Infinity, Infinity);
    let lastPins: Pin[] | undefined;
    // Read all label dimensions together only when content or viewport changes.
    // Avoid hundreds of read/write layout cycles on every globe animation frame.
    const metrics = new Map<
      HTMLButtonElement,
      { caption: HTMLElement; width: number; height: number }
    >();
    let frame = 0;
    let previous = performance.now();
    const render = (now: number) => {
      if (disposed) return;
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (destination) {
        const fraction = 1 - Math.exp(-delta * 5);
        const radius = THREE.MathUtils.lerp(
          camera.position.length(),
          destination.length(),
          fraction,
        );
        const rotation = new THREE.Quaternion().setFromUnitVectors(
          camera.position.clone().normalize(),
          destination.clone().normalize(),
        );
        const step = new THREE.Quaternion().slerp(rotation, fraction);
        camera.position.applyQuaternion(step).setLength(radius);
        if (camera.position.distanceTo(destination) < 0.005) destination = null;
      }
      controls.update(delta);
      renderer.render(scene, camera);
      const currentPins = dataRef.current.pins;
      if (
        !metricsDirty &&
        lastPins === currentPins &&
        lastCamera.distanceToSquared(camera.position) < 1e-12
      ) {
        frame = requestAnimationFrame(render);
        return;
      }
      if (metricsDirty || lastPins !== currentPins) {
        metrics.clear();
        for (const label of labels.current.values()) {
          const caption = label.querySelector<HTMLElement>(".pin-label")!;
          metrics.set(label, {
            caption,
            width: caption.offsetWidth,
            height: caption.offsetHeight,
          });
        }
        metricsDirty = false;
      }
      lastPins = currentPins;
      lastCamera.copy(camera.position);
      const hostWidth = host.clientWidth,
        hostHeight = host.clientHeight;
      const occupied: {
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];
      for (const pin of currentPins) {
        const label = labels.current.get(pin.film.id + ":" + pin.place.id);
        if (!label) continue;
        const vector = pin.vector;
        const visible = vector.dot(camera.position) - vector.lengthSq() > 0.02;
        pinPosition.copy(vector).project(camera);
        label.style.left = `${(pinPosition.x + 1) * 50}%`;
        label.style.top = `${(-pinPosition.y + 1) * 50}%`;
        label.style.visibility = visible ? "visible" : "hidden";
        label.style.zIndex =
          pin.film.id === dataRef.current.selectedId ? "3" : "2";
        if (visible) {
          const { caption, width, height } = metrics.get(label)!;
          const x =
            ((pinPosition.x + 1) * hostWidth) / 2 +
            (pin.place.id === "cornwall" ? -width - 9 : 13);
          const y =
            ((-pinPosition.y + 1) * hostHeight) / 2 +
            (pin.place.id === "cornwall" ? -26 : -7);
          let offset: number | undefined;
          for (const option of [0, 24, -24, 48, -48]) {
            const top = y + option;
            if (
              top < 0 ||
              top + height > hostHeight ||
              x < 0 ||
              x + width > hostWidth
            )
              continue;
            if (
              !occupied.some(
                (rect) =>
                  x < rect.x + rect.width + 5 &&
                  x + width + 5 > rect.x &&
                  top < rect.y + rect.height + 4 &&
                  top + height + 4 > rect.y,
              )
            ) {
              offset = option;
              break;
            }
          }
          caption.style.transform = `translateY(${offset ?? 0}px)`;
          caption.style.visibility =
            offset === undefined ? "hidden" : "inherit";
          if (offset !== undefined)
            occupied.push({ x, y: y + offset, width, height });
        }
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        previous = performance.now();
        frame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("keydown", keydown);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      controls.dispose();
      texture?.dispose();
      geometry.dispose();
      material.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      gridMaterial.dispose();
      gridGeometries.forEach((g) => g.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      controlsRef.current = null;
    };
  }, []);

  const previousSelection = useRef(selected?.id + ":" + activePlace);
  useEffect(() => {
    const key = selected?.id + ":" + activePlace;
    if (key === previousSelection.current) return;
    previousSelection.current = key;
    const place =
      selected?.places.find((p) => p.id === activePlace) ?? selected?.places[0];
    if (place) {
      controlsRef.current?.focus(place);
      setRotating(false);
    }
  }, [selected, activePlace]);

  return (
    <section className="globe-panel" aria-label="장소 탐험">
      <div className="globe-topline">
        <span>THE WORLD, THROUGH FILM</span>
        <span>지구본 탐험</span>
      </div>
      <div className="globe-stage" ref={container}>
        <div className="globe-orbit orbit-one" />
        <div className="globe-orbit orbit-two" />
        <div className="globe-pins">
          {pins.map(({ film, place, films: placeFilms, places }) => (
            <button
              key={film.id + ":" + place.id}
              ref={(el) => {
                const id = film.id + ":" + place.id;
                if (el) labels.current.set(id, el);
                else labels.current.delete(id);
              }}
              className={`map-pin ${selected?.id === film.id ? "selected" : ""} ${place.id === "cornwall" ? "secondary-pin" : ""}`}
              style={{ "--pin-color": film.color } as React.CSSProperties}
              aria-label={
                placeFilms.length > 1
                  ? `${place.name}${places.length > 1 ? ` 외 ${places.length - 1}곳` : ""}: 영화 ${placeFilms.length}편`
                  : `${place.name}: ${film.title}`
              }
              aria-haspopup={placeFilms.length > 1 ? "dialog" : undefined}
              aria-expanded={
                placeFilms.length > 1 ? openPlace === place.id : undefined
              }
              aria-pressed={
                selected?.id === film.id && activePlace === place.id
              }
              onClick={() => {
                if (placeFilms.length > 1) setOpenPlace(place.id);
                else onSelect(film, place);
              }}
            >
              <span className="pin-dot" />
              {placeFilms.length > 1 && (
                <span className="pin-count">{placeFilms.length}</span>
              )}
              <span className="pin-label">
                {place.name}
                {places.length > 1 ? ` 외 ${places.length - 1}곳` : ""}
                <small>
                  {placeFilms.length > 1
                    ? `${placeFilms.length}편의 영화`
                    : film.title}
                </small>
              </span>
            </button>
          ))}
        </div>
        {openPin && (
          <div
            ref={placePicker}
            className="place-picker"
            role="dialog"
            aria-label={`${openPin.place.name}의 영화 선택`}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                closePicker();
              }
            }}
          >
            <div className="place-picker-heading">
              <div>
                <span>
                  {openPin.places.length > 1
                    ? `가까운 ${openPin.places.length}곳의 영화`
                    : "이곳의 영화"}
                </span>
                <h3>
                  {openPin.place.name} <small>{openPin.films.length}편</small>
                </h3>
              </div>
              <button
                className="icon-button"
                aria-label="장소의 영화 목록 닫기"
                onClick={closePicker}
              >
                <X size={18} />
              </button>
            </div>
            {openPin.films.map((film) => (
              <button
                key={film.id}
                className="place-picker-film"
                onClick={() => {
                  setOpenPlace(null);
                  onSelect(
                    film,
                    openPin.filmPlaces.get(film.id) ?? openPin.place,
                  );
                }}
              >
                <span>
                  <strong>{film.title}</strong>
                  <small>
                    {openPin.filmPlaces.get(film.id)?.name} · {film.period}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
        {error && (
          <div className="globe-error" role="status">
            {error}
          </div>
        )}
      </div>
      <div className="globe-bottomline">
        <div className="globe-help">
          <span className="tiny-orbit">⊕</span>
          <div>
            드래그하여 돌아보기
            <small>확대하면 장소가 펼쳐져요 · 숫자를 눌러 영화 보기</small>
          </div>
        </div>
        <div className="globe-controls">
          <button
            aria-label={rotating ? "자동 회전 멈추기" : "자동 회전 시작"}
            aria-pressed={rotating}
            onClick={() => {
              controlsRef.current?.spin(!rotating);
              setRotating(!rotating);
            }}
          >
            {rotating ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            aria-label="지구본 축소"
            onClick={() => controlsRef.current?.zoom(1.15)}
          >
            <Minus size={17} />
          </button>
          <button
            aria-label="지구본 확대"
            onClick={() => controlsRef.current?.zoom(0.87)}
          >
            <Plus size={17} />
          </button>
          <button
            aria-label="처음 시점으로"
            onClick={() => {
              controlsRef.current?.reset();
              setRotating(false);
            }}
          >
            <LocateFixed size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
