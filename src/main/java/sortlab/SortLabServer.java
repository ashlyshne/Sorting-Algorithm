package sortlab;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SortLabServer {
    private static final int PORT = 8080;
    private static final Pattern ALGORITHM_FIELD = Pattern.compile("\"algorithm\"\\s*:\\s*\"(quick|merge)\"");
    private static final Pattern NUMBERS_FIELD = Pattern.compile("\"numbers\"\\s*:\\s*\\[([^\\]]*)\\]");
    private static final Path WEB_ROOT = Path.of("web").toAbsolutePath().normalize();

    private SortLabServer() {
    }

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/sort", SortLabServer::handleSort);
        server.createContext("/", SortLabServer::handleStaticFile);
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        System.out.println("Sort Lab is running at http://localhost:" + PORT);
    }

    private static void handleSort(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"Use POST to request a sort.\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        if (body.length() > 8192) {
            sendJson(exchange, 400, "{\"error\":\"The request is too large.\"}");
            return;
        }

        try {
            SortRequest request = parseRequest(body);
            List<SortStep> steps = switch (request.algorithm()) {
                case "quick" -> QuickSort.sort(request.numbers());
                case "merge" -> MergeSort.sort(request.numbers());
                default -> throw new IllegalArgumentException("Choose Quick Sort or Merge Sort.");
            };
            sendJson(exchange, 200, toJson(steps));
        } catch (IllegalArgumentException exception) {
            sendJson(exchange, 400, "{\"error\":" + quote(exception.getMessage()) + "}");
        }
    }

    private static SortRequest parseRequest(String body) {
        Matcher algorithmMatcher = ALGORITHM_FIELD.matcher(body);
        Matcher numbersMatcher = NUMBERS_FIELD.matcher(body);
        if (!body.stripLeading().startsWith("{") || !body.stripTrailing().endsWith("}")
                || !algorithmMatcher.find() || !numbersMatcher.find()) {
            throw new IllegalArgumentException("Send an algorithm and a list of whole numbers.");
        }

        String numbersText = numbersMatcher.group(1).trim();
        if (numbersText.isEmpty()) {
            throw new IllegalArgumentException("Enter between 2 and 80 whole numbers.");
        }

        String[] parts = numbersText.split(",", -1);
        if (parts.length < 2 || parts.length > 80) {
            throw new IllegalArgumentException("Enter between 2 and 80 whole numbers.");
        }

        List<Integer> numbers = new ArrayList<>(parts.length);
        for (String part : parts) {
            String token = part.trim();
            if (!token.matches("\\d+")) {
                throw new IllegalArgumentException("Use whole numbers separated by commas.");
            }
            try {
                numbers.add(Integer.parseInt(token));
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException("Each number must be between 0 and 2,147,483,647.");
            }
        }

        return new SortRequest(algorithmMatcher.group(1), numbers);
    }

    private static String toJson(List<SortStep> steps) {
        StringBuilder json = new StringBuilder("{\"steps\":[");
        for (int stepIndex = 0; stepIndex < steps.size(); stepIndex++) {
            if (stepIndex > 0) {
                json.append(',');
            }
            SortStep step = steps.get(stepIndex);
            json.append("{\"values\":[");
            for (int valueIndex = 0; valueIndex < step.values().size(); valueIndex++) {
                if (valueIndex > 0) {
                    json.append(',');
                }
                json.append(step.values().get(valueIndex));
            }
            json.append("],\"start\":").append(step.start())
                    .append(",\"end\":").append(step.end())
                    .append(",\"label\":").append(quote(step.label()))
                    .append(",\"explanation\":").append(quote(step.explanation()))
                    .append(",\"procedure\":[");
            for (int procedureIndex = 0; procedureIndex < step.procedure().size(); procedureIndex++) {
                if (procedureIndex > 0) json.append(',');
                json.append(quote(step.procedure().get(procedureIndex)));
            }
            json.append("]}");
        }
        return json.append("]}").toString();
    }

    private static void handleStaticFile(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendText(exchange, 405, "text/plain; charset=utf-8", "Method not allowed");
            return;
        }

        String requestedPath = exchange.getRequestURI().getPath();
        Path file = WEB_ROOT.resolve(requestedPath.substring(1)).normalize();
        if (requestedPath.equals("/")) {
            file = WEB_ROOT.resolve("index.html");
        }
        if (!file.startsWith(WEB_ROOT) || !Files.isRegularFile(file)) {
            sendText(exchange, 404, "text/plain; charset=utf-8", "Not found");
            return;
        }

        String contentType = switch (file.getFileName().toString()) {
            case "index.html" -> "text/html; charset=utf-8";
            case "styles.css" -> "text/css; charset=utf-8";
            case "app.js" -> "text/javascript; charset=utf-8";
            default -> "application/octet-stream";
        };
        byte[] content = Files.readAllBytes(file);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, content.length);
        exchange.getResponseBody().write(content);
        exchange.close();
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        sendText(exchange, status, "application/json; charset=utf-8", body);
    }

    private static void sendText(HttpExchange exchange, int status, String contentType, String body)
            throws IOException {
        byte[] content = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, content.length);
        exchange.getResponseBody().write(content);
        exchange.close();
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private record SortRequest(String algorithm, List<Integer> numbers) {
    }

    public record SortStep(List<Integer> values, int start, int end, String label, String explanation,
                           List<String> procedure) {
    }
}
