# Capturas y demo

Este directorio contiene los recursos visuales referenciados en el README.

## Archivos necesarios

| Archivo                | Descripción                                   |
| ---------------------- | --------------------------------------------- |
| `screenshot-home.png`  | Página de inicio con el formulario.           |
| `screenshot-dashboard.png` | Dashboard con la lista de enlaces.        |
| `screenshot-detail.png` | Detalle de enlace con gráficas y QR.         |
| `demo.gif`             | GIF del flujo completo (crear → redirigir → dashboard). |

## Cómo grabar el GIF (Linux)

Recomendado: [Peek](https://github.com/phw/peek) o [asciinema](https://asciinema.org) para terminal.

```bash
# Con Peek (GUI):
sudo apt install peek
# Graba 10-15s creando un enlace y viendo la gráfica, exporta como demo.gif
```

Alternativa con `ffmpeg` a partir de una captura de pantalla:

```bash
ffmpeg -i grabacion.mp4 -vf "fps=12,scale=960:-1" docs/demo.gif
```

## Cómo tomar capturas

```bash
# Con GNOME Screenshot o Flameshot
flameshot gui
```
