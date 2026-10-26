package sortlab;

import java.util.ArrayList;
import java.util.List;

public final class MergeSort {
    private MergeSort() {
    }

    public static List<SortLabServer.SortStep> sort(List<Integer> input) {
        int[] values = input.stream().mapToInt(Integer::intValue).toArray();
        List<SortLabServer.SortStep> steps = new ArrayList<>();
        mergeSort(values, 0, values.length - 1, steps);
        return steps;
    }

    private static void mergeSort(int[] values, int start, int end, List<SortLabServer.SortStep> steps) {
        if (start >= end) {
            return;
        }

        int middle = start + (end - start) / 2;
        steps.add(new SortLabServer.SortStep(snapshot(values), start, end,
                "Split positions " + (start + 1) + "–" + (end + 1),
                "Merge Sort keeps dividing until each section contains one value. A one-value section is already sorted.",
                List.of("Find the midpoint of positions " + (start + 1) + "–" + (end + 1) + ".",
                        "Create a left section (" + (start + 1) + "–" + (middle + 1) + ") and a right section (" + (middle + 2) + "–" + (end + 1) + ").",
                        "Finish splitting the left section, then split the right section.")));
        mergeSort(values, start, middle, steps);
        mergeSort(values, middle + 1, end, steps);
        merge(values, start, middle, end);
        steps.add(new SortLabServer.SortStep(snapshot(values), start, end,
                "Merge positions " + (start + 1) + "–" + (end + 1),
                "Both halves are sorted individually. Merging rebuilds this section in order by repeatedly taking the smaller front value.",
                List.of("Look at the first unmerged value in each half.",
                        "Copy the smaller value into the next open position.",
                        "Advance in the half you took it from and compare again.",
                        "When one half runs out, append every remaining value from the other half.")));
    }

    private static void merge(int[] values, int start, int middle, int end) {
        int[] merged = new int[end - start + 1];
        int left = start;
        int right = middle + 1;
        int next = 0;

        while (left <= middle && right <= end) {
            merged[next++] = values[left] <= values[right] ? values[left++] : values[right++];
        }
        while (left <= middle) {
            merged[next++] = values[left++];
        }
        while (right <= end) {
            merged[next++] = values[right++];
        }
        System.arraycopy(merged, 0, values, start, merged.length);
    }

    private static List<Integer> snapshot(int[] values) {
        List<Integer> snapshot = new ArrayList<>(values.length);
        for (int value : values) {
            snapshot.add(value);
        }
        return snapshot;
    }
}
