package sortlab;

import java.util.ArrayList;
import java.util.List;

public final class QuickSort {
    private QuickSort() {
    }

    public static List<SortLabServer.SortStep> sort(List<Integer> input) {
        int[] values = input.stream().mapToInt(Integer::intValue).toArray();
        List<SortLabServer.SortStep> steps = new ArrayList<>();
        quickSort(values, 0, values.length - 1, steps);
        return steps;
    }

    private static void quickSort(int[] values, int low, int high, List<SortLabServer.SortStep> steps) {
        if (low >= high) {
            return;
        }

        int pivot = values[high];
        int boundary = low;
        addStep(values, low, high, "Choose " + pivot + " as the pivot",
                "Quick Sort partitions one section at a time. This pivot becomes the divider between smaller and larger values.",
                List.of("Take the last value in the active section as the pivot.",
                        "Set the boundary to the first position in the section.",
                        "Scan the remaining values from left to right."), steps);
        for (int index = low; index < high; index++) {
            int compared = values[index];
            if (values[index] <= pivot) {
                swap(values, boundary, index);
                addStep(values, low, high, "Compare " + compared + " with pivot " + pivot,
                        compared + " is less than or equal to " + pivot + ", so it belongs on the pivot's left.",
                        List.of("Compare " + compared + " to " + pivot + ".",
                                "Swap it into the boundary position so smaller values stay together.",
                                "Move the boundary one place right for the next qualifying value."), steps);
                boundary++;
            } else {
                addStep(values, low, high, "Compare " + compared + " with pivot " + pivot,
                        compared + " is greater than " + pivot + ", so it remains in the right partition.",
                        List.of("Compare " + compared + " to " + pivot + ".",
                                "Leave it where it is; the scan continues.",
                                "Keep the boundary in place because no new smaller value was found."), steps);
            }
        }

        swap(values, boundary, high);
        addStep(values, low, high, "Place pivot " + values[boundary] + " in its final position",
                "The pivot is now between values no greater than it and values greater than it. It is in its final sorted position.",
                List.of("Swap the pivot with the first value in the right partition.",
                        "Treat the pivot position as finished.",
                        "Repeat the same process on the section left of the pivot, then the section right of it."), steps);
        quickSort(values, low, boundary - 1, steps);
        quickSort(values, boundary + 1, high, steps);
    }

    private static void swap(int[] values, int left, int right) {
        int value = values[left];
        values[left] = values[right];
        values[right] = value;
    }

    private static void addStep(int[] values, int start, int end, String label, String explanation,
                                List<String> procedure,
                                List<SortLabServer.SortStep> steps) {
        List<Integer> snapshot = new ArrayList<>(values.length);
        for (int value : values) {
            snapshot.add(value);
        }
        steps.add(new SortLabServer.SortStep(snapshot, start, end, label, explanation, procedure));
    }
}
