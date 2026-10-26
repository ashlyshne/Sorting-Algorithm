# Sort Lab

Sort Lab is a small, database-free sorting visualizer. A Java 17+ HTTP server runs Quick Sort or Merge Sort, returns a snapshot for each meaningful operation, and serves the HTML, CSS, and JavaScript interface.

## Project files

- `src/main/java/sortlab/SortLabServer.java` starts the built-in `HttpServer`, serves the static site, validates requests, and serializes the animation steps.
- `src/main/java/sortlab/QuickSort.java` contains the in-place Quick Sort partitioning logic and records each partition change.
- `src/main/java/sortlab/MergeSort.java` contains the recursive Merge Sort and records each completed merge range.
- `web/index.html`, `web/styles.css`, and `web/app.js` make up the browser interface and animation.

## Requirements

- JDK 17 or newer
- A terminal (VS Code's integrated terminal works)

Check the installed JDK from the project folder:

```sh
java -version
javac -version
```

## Run in VS Code

1. Open this project folder in VS Code: **File > Open Folder...** and choose `Sorting-Algorithm`.
2. Open **Terminal > New Terminal**. Make sure the terminal is at the project root (the folder containing this README).
3. Compile the Java files:

   ```sh
   mkdir -p out
   javac -d out src/main/java/sortlab/*.java
   ```

4. Start the server:

   ```sh
   java -cp out sortlab.SortLabServer
   ```

5. Open [http://localhost:8080](http://localhost:8080) in your browser. Leave the terminal running while using the site; press `Ctrl+C` there to stop it.

For Java syntax highlighting and the Run/Debug controls, install the **Extension Pack for Java** from the VS Code Extensions view. The terminal commands above work without a VS Code extension.

## Use the visualizer

Enter 2 to 80 comma-separated whole numbers, choose an algorithm, and select **Start sorting**. Use **Randomize** for a fresh list, **Reset to original** to restore the current input, or the timeline and speed menu to control playback. The range highlighted in green is the partition or merge currently being processed.

The server validates each request as well as the browser. Whole-number values range from `0` to Java's maximum `int` value. The sort endpoint is `POST /api/sort` and accepts JSON such as:

```json
{"algorithm":"quick","numbers":[38,12,27,5]}
```

It returns a `steps` array; each step has a `values` snapshot, zero-based `start` and `end` indices for the active range, and a short `label` for the animation.